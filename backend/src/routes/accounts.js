const express = require('express');
const BankDatabase = require('../BankDatabase');

const router = express.Router();
const db = new BankDatabase();

// this query fetches the latest balance for each account
// it does this by combining the latest transaction and account_history records
// and then selecting the latest of those
// it then joins this with the account table to get the account details
const sql = `
SELECT a.*,
       b.balance,
       b.datetime as balance_datetime,
       b.src as balance_source
FROM account a
LEFT JOIN (
    SELECT account,
           MAX(datetime) AS datetime,
           balance,
           src
    FROM (
        SELECT account,
               MAX(t.datetime) as datetime,
               rowid, -- i was hoping to get this working
               balance,
               'transaction' AS src
        FROM 'transaction' t
        GROUP BY account

        UNION ALL

        SELECT accountid AS account,
               datetime,
               MAX(rowid) AS rowid,
               balance,
               'account_history' AS src
        FROM "account_history"
        GROUP BY accountid
		
    ) AS combined
    GROUP BY account
) AS b
ON a.accountid = b.account
WHERE 1=1
`

/**
 * GET /api/accounts
 * Retrieve all accounts
 */
router.get('/api/accounts', async (req, res) => {
    try {
        const accounts = db.db.prepare(sql).all();
        res.json({ success: true, accounts });
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
        const account = db.db.prepare(`${sql} AND accountid = ?`).get(id);

        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});

/**
 * UPSERT /api/accounts
 * Create or update an account
 */
router.post('/api/accounts', async (req, res) => {
    try {
        const { accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata } = req.body;

        // Ensure accountid is provided
        if (!accountid) {
            return res.status(400).json({ success: false, message: "Missing required field: accountid" });
        }

        const query = `
            INSERT INTO account (accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(accountid) DO UPDATE SET 
                institution = excluded.institution,
                name = excluded.name,
                holders = excluded.holders,
                currency = excluded.currency,
                type = excluded.type,
                timezone = excluded.timezone,
                shortname = excluded.shortname,
                parentid = excluded.parentid,
                metadata = excluded.metadata`;

        const stmt = db.db.prepare(query);
        stmt.run(accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata);

        res.json({ success: true, message: "Account upserted successfully", accountid });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});



/**
 * UPSERT /api/accounts/:id
 * Create or update an account
 */
router.post('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { institution, name, holders, currency, type, timezone, shortname, parentid, metadata } = req.body;

        // if (!name) {
        //     return res.status(400).json({ success: false, message: "Missing required field: name" });
        // }

        const query = `
            INSERT INTO account (accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(accountid) DO UPDATE SET 
                institution = excluded.institution,
                name = excluded.name,
                holders = excluded.holders,
                currency = excluded.currency,
                type = excluded.type,
                timezone = excluded.timezone,
                shortname = excluded.shortname,
                parentid = excluded.parentid,
                metadata = excluded.metadata`;

        const stmt = db.db.prepare(query);
        stmt.run(id, institution, name, holders, currency, type, timezone, shortname, parentid, metadata);

        res.json({ success: true, message: "Account upserted successfully", accountid: id });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
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
