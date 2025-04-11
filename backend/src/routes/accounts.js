const express = require('express');
const BankDatabase = require('../BankDatabase');
const { body, validationResult } = require('express-validator'); // Ensure body is imported correctly

const router = express.Router();
const db = new BankDatabase();
const logger = require('../Logger.js');


// this query fetches the latest balance for each account
// it does this by combining the latest transaction and account_history records
// and then selecting the latest of those
// it then joins this with the account table to get the account details
const sql = `
SELECT
    a.*, -- Select all columns from the account table
    COALESCE(ah.balance, t_latest.balance) AS balance, -- Prioritize account_history balance
    COALESCE(ah.datetime, t_latest.datetime) AS balance_datetime, -- Prioritize account_history datetime
    CASE
        WHEN ah.accountid IS NOT NULL THEN 'account_history' -- Source is account_history if found
        ELSE 'transaction' -- Otherwise, source is transaction
    END AS balance_source
FROM
    account a
LEFT JOIN (
    -- Find the latest entry using ROW_NUMBER() ordered by datetime DESC, then is_reference DESC, then rowid DESC
    SELECT accountid, datetime, balance
    FROM (
        SELECT
            h.accountid,
            h.datetime,
            h.balance,
            h.is_reference, -- Include is_reference for ordering
            ROW_NUMBER() OVER(PARTITION BY h.accountid ORDER BY h.datetime DESC, h.is_reference DESC, h.rowid DESC) as rn
        FROM account_history h
    )
    WHERE rn = 1
) ah ON a.accountid = ah.accountid
LEFT JOIN (
    -- Find the latest transaction entry using ROW_NUMBER() ordered by datetime DESC, then rowid DESC
    SELECT account, datetime, balance
    FROM (
        SELECT
            t.account,
            t.datetime,
            t.balance,
            ROW_NUMBER() OVER(PARTITION BY t.account ORDER BY t.datetime DESC, t.rowid DESC) as rn
        FROM "transaction" t
        WHERE t.balance IS NOT NULL -- Only consider transactions with a balance
    )
    WHERE rn = 1
) t_latest ON a.accountid = t_latest.account AND ah.accountid IS NULL -- Join ONLY if no account_history was found
WHERE 1=1 -- Placeholder for potential future WHERE clauses on 'a'
`
const interestSql = `
SELECT historyid,
  accountid,
  MAX(datetime) as datetime,
  json_extract(data, '$.interest') AS interest
FROM account_history AS a
WHERE interest IS NOT NULL
`

/**
 * GET /api/accounts
 * Retrieve all accounts
 */
router.get('/api/accounts', async (req, res) => {
    try {
        // get account data
        const accounts = db.db.prepare(sql).all();

        // get interest data
        const interest = db.db.prepare(interestSql + " GROUP BY accountid").all();

        // merge interest rate and interest daatetime into accounts by accountid
        interest.forEach(account => {
            const acc = accounts.find(a => a.accountid === account.accountid);
            if (acc) {
                acc.interest = account.interest;
                acc['interest_datetime'] = account.datetime;
            }
        }
        );
        res.json({ success: true, account: accounts });

    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});

/**
 * GET /api/accounts/:id
 * Retrieve a single account by accountid
 */
router.get('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const account = db.db.prepare(`${sql} AND a.accountid = ?`).get(id); // Specify a.accountid

        // get interest data and merge it in
        const sqlFinal = interestSql + " AND accountid = ?"

        const interest = db.db.prepare(sqlFinal).all(id);
        interest.forEach(interestAccount => {
            account['interest'] = interestAccount.interest;
            account['interest_datetime'] = interestAccount.datetime;
        });

        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});


// Prepare fields to update or insert
function prepareFields(fields, requestBody) {
    let values = [];

    // Collect key-value pairs and prepare values
    fields.forEach((key) => {
        const value = requestBody[key];
        if (value !== undefined) {
            values.push({ key, value });
        }
    });

    return values;
}

// Insert account function
async function insertAccount(accountid, fieldsToInsert, valuesToInsert) {
    const placeholders = new Array(fieldsToInsert.length).fill('?').join(', ');
    const columns = ['accountid', ...fieldsToInsert].join(", ");
    const insertQuery = `
        INSERT INTO account (${columns})
        VALUES (?, ${placeholders})
    `;

    try {
        const stmt = db.db.prepare(insertQuery);
        stmt.run(valuesToInsert);
        return { success: true, message: "Account created successfully", accountid };
    } catch (insertError) {
        if (insertError.message.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Account ID already exists." };
        }
        throw insertError; // Rethrow if it's an unexpected error
    }
}

// Update account function
async function updateAccount(fieldsToUpdate, valuesToUpdate) {
    const updateFields = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const updateQuery = `
        UPDATE account 
        SET ${updateFields}
        WHERE accountid = ?
    `;

    // logger.info(`Update query: ${updateQuery}`);
    // logger.info(`Values to update: ${valuesToUpdate}`);

    try {
        const stmt = db.db.prepare(updateQuery);
        stmt.run(valuesToUpdate);
        return { success: true, message: "Account updated successfully" };
    } catch (error) {
        throw error; // Rethrow if it's an error
    }
}

const accountKeys = [
    "institution", "name", "holders", "currency", "type", "category", "timezone", "shortname", "parentid", "status", "metadata"
];

const validationRules = accountKeys.map(key => body(key).optional().trim());

// Validation and logic for both creating and updating accounts
async function handleAccountAction(req, res, method) {

    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }


    const fieldsToProcess = prepareFields(accountKeys, req.body);

    // If no fields are provided, return an error
    if (fieldsToProcess.length === 0) {
        return res.status(400).json({ success: false, message: "No fields provided to create or update the account." });
    }

    // Extract fields and values
    const fields = fieldsToProcess.map(field => field.key);
    const values = fieldsToProcess
        .map(field => field.value)
        .map(v => v === "" ? null : v)
        
    try {
        if (method === 'POST') {
            // Handle Create (POST)
            const accountid = req.body.accountid;
            return await insertAccount(accountid, fields, [accountid, ...values]);
        } else if (method === 'PATCH') {
            // Handle Update (PATCH)
            const accountid = req.params.id;
            return await updateAccount(fields, [...values, accountid]);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
}


// POST Route - Create Account
router.post('/api/accounts', validationRules, async (req, res) => {
    const result = await handleAccountAction(req, res, 'POST');
    if (result?.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// PATCH Route - Update Account
router.patch('/api/accounts/:id', validationRules, async (req, res) => {
    const result = await handleAccountAction(req, res, 'PATCH');

    if (result?.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * DELETE /api/accounts/:id
 * Delete an account
 */
router.delete('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = db.db.prepare("DELETE FROM account WHERE accountid = ?").run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: API for managing accounts
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Retrieve all accounts
 *     description: Fetch a list of all accounts.
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       accountid:
 *                         type: string
 *                         example: "12345"
 *                       name:
 *                         type: string
 *                         example: "Main Savings"
 *       500:
 *         description: Database error
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Retrieve an account
 *     description: Fetch a specific account by its ID.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the account to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 account:
 *                   type: object
 *                   properties:
 *                     accountid:
 *                       type: string
 *                       example: "12345"
 *                     name:
 *                       type: string
 *                       example: "Main Savings"
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     description: Remove an account from the system.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the account to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 *       500:
 *         description: Database error
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   post:
 *     summary: Create or update an account
 *     description: If the account exists, update it. If not, create a new account.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the account (UUID)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Main Savings"
 *               institution:
 *                 type: string
 *                 example: "Bank A"
 *               holders:
 *                 type: string
 *                 example: "John Doe"
 *               currency:
 *                 type: string
 *                 example: "AUD"
 *               type:
 *                 type: string
 *                 example: "savings"
 *               timezone:
 *                 type: string
 *                 example: "Australia/Sydney"
 *               shortname:
 *                 type: string
 *                 example: "Savings"
 *               parentid:
 *                 type: string
 *                 example: "98765"
 *               metadata:
 *                 type: string
 *                 example: "{}"
 *     responses:
 *       200:
 *         description: Account created or updated successfully
 *       400:
 *         description: Missing required field (name)
 *       500:
 *         description: Database error
 */
