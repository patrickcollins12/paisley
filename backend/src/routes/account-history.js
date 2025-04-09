const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const BankDatabase = require("../BankDatabase");
const logger = require("../Logger");

// Set to false to enforce authentication. Set it to true when doing unit tests
const disableAuth = false;

/**
 * Middleware: Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

/**
 * POST /account_balance
 * Records a new balance for an account at a specific date.
 */
router.post(
    "/api/account_balance",
    [
        body("accountid").isString().notEmpty().withMessage("Account ID is required"),
        body("datetime").optional().isISO8601().withMessage("Invalid datetime format"),
        body("balance").isFloat().withMessage("Balance must be a number"),
        body("data").optional().isObject().withMessage("Metadata must be a JSON object"),
        body("is_reference").optional().isBoolean().toBoolean().withMessage("is_reference must be a boolean"), // Added validation
    ],
    handleValidationErrors,
    async (req, res) => {
        let db; // Initialize db later for transaction scope
        // Extract is_reference, default to false
        const { accountid, datetime = new Date().toISOString(), balance, data = {}, is_reference = false } = req.body;
        // Define queries
        const insertQuery = `INSERT INTO account_history (accountid, datetime, balance, data, is_reference) VALUES (?, ?, ?, ?, ?)`;
        const deleteQuery = `DELETE FROM account_history WHERE accountid = ?`;

        try {
            db = new BankDatabase(); // Instantiate DB connection
            let result;

            if (is_reference) {
                // Use a transaction for atomicity when setting a reference balance
                const runTransaction = db.db.transaction(() => {
                    // 1. Delete all existing history for the account
                    const deleteStmt = db.db.prepare(deleteQuery);
                    deleteStmt.run(accountid);
                    logger.info(`Deleted existing history for account ${accountid} before setting reference balance.`);

                    // 2. Insert the new reference balance
                    const insertStmt = db.db.prepare(insertQuery);
                    result = insertStmt.run(accountid, datetime, balance, JSON.stringify(data), 1); // Convert true to 1
                    logger.info(`Inserted new reference balance for account ${accountid} with historyid ${result.lastInsertRowid}.`);

                    // Recalculation will happen *after* this transaction commits.
                });
                runTransaction(); // Execute the transaction to delete history and insert reference


                // Call recalculate *after* the reference balance transaction is successful.
                // The recalculate function handles its own internal transaction.
                try {
                    // Note: We don't wait for recalculation to finish before responding to the user
                    //       as it might take time. We trigger it asynchronously.
                    db.recalculateAccountBalances(accountid)
                        .then(() => {
                            logger.info(`Recalculation successfully triggered for account ${accountid} after setting reference balance.`);
                        })
                        .catch(recalcErr => {
                            // Log error, but don't fail the initial request as the reference balance *was* set.
                            logger.error(`Recalculation failed for account ${accountid} after setting reference balance: ${recalcErr.message}`, recalcErr);
                        });
                } catch (triggerErr) {
                     // Catch potential synchronous errors if the async call itself fails immediately
                     logger.error(`Failed to trigger recalculation for account ${accountid}: ${triggerErr.message}`, triggerErr);
                }
                // --- End Sprint 2 ---

                res.status(201).json({ historyid: result.lastInsertRowid, message: "Reference balance recorded, recalculation triggered" }); // Updated message

            } else {
                // Standard balance insertion (not a reference)
                const stmt = db.db.prepare(insertQuery);
                result = stmt.run(accountid, datetime, balance, JSON.stringify(data), 0); // Convert false to 0
                res.status(201).json({ historyid: result.lastInsertRowid, message: "Balance recorded" });
            }

        } catch (err) {
            logger.error(`Error processing account balance: ${err.message}`, { accountid, is_reference });

            if (err.message.includes("FOREIGN KEY constraint failed")) {
                return res.status(400).json({ error: `Account ID '${accountid}' does not exist.` });
            }
            // Ensure db connection is closed if opened
            // if (db) db.close(); // Assuming BankDatabase has a close method if needed

            res.status(500).json({ error: `Server error processing balance: ${err.message}` });
        } finally {
             // Ensure db connection is closed if opened and BankDatabase has a close method
             // if (db && typeof db.close === 'function') {
             //    db.close();
             // }
        }
    }
);

const util = require('../AccountHistoryDataTransform');

router.get(
    "/api/account_history",
    [
        query("accountid").optional().isString().withMessage("Account ID must be a string"),
        query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
        query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
        query("interpolate").optional().toBoolean()
    ],
    async (req, res) => {
        let db = new BankDatabase();
        let { accountid, from, to, interpolate=false } = req.query;

        // Enforce that 'accountid' is required if 'interpolate' is true
        if (interpolate && !accountid) {
            return res.status(400).json({ error: "Account ID is required when interpolation is enabled." });
        }

        let query = '';
        let params = [];
        let baseQuery = '';

        if (accountid) {
            // Check if this specific account exists in account_history
            const checkHistoryStmt = db.db.prepare(`SELECT 1 FROM account_history WHERE accountid = ? LIMIT 1`);
            const historyExists = checkHistoryStmt.get(accountid);

            if (historyExists) {
                // If history exists, ONLY query account_history for this account
                logger.info(`Account ${accountid} found in account_history. Querying only history.`);
                baseQuery = `
                    SELECT
                        h.accountid,
                        h.datetime,
                        h.balance,
                        h.data,
                        h.is_reference,
                        a.parentid as parentid,
                        'account_history' as source
                    FROM account_history h
                    LEFT JOIN account a on h.accountid = a.accountid
                    WHERE h.accountid = ?`;
                params.push(accountid);
            } else {
                // If no history exists, ONLY query transaction table for this account
                logger.info(`Account ${accountid} not found in account_history. Querying only transactions.`);
                baseQuery = `
                    SELECT
                        t.account as accountid,
                        t.datetime,
                        t.balance,
                        null as data,
                        0 as is_reference,
                        a.parentid as parentid,
                        'transaction' as source
                    FROM 'transaction' t
                    LEFT JOIN account a on t.account = a.accountid
                    WHERE t.account = ? AND t.balance IS NOT NULL`;
                params.push(accountid);
            }

            // Apply date filters if provided
            if (from) {
                baseQuery += ` AND datetime >= ?`;
                params.push(from);
            }
            if (to) {
                baseQuery += ` AND datetime <= ?`;
                params.push(to);
            }
            baseQuery += ` ORDER BY datetime ASC`; // Order only by datetime for single account
            query = baseQuery;

        } else {
            // If no specific accountid, use the previous UNION logic (might need review later)
            logger.warn(`No specific accountid provided. Using UNION query for account_history.`);
            baseQuery = `
                SELECT
                    h.accountid, h.datetime, h.balance, h.data, h.is_reference,
                    a.parentid as parentid, 'account_history' as source
                FROM account_history h
                LEFT JOIN account a on h.accountid = a.accountid
                UNION
                SELECT
                    t.account, t.datetime, t.balance, null, 0,
                    a.parentid as parentid, 'transaction' as source
                FROM 'transaction' t
                LEFT JOIN account a on t.account = a.accountid
                WHERE t.balance IS NOT NULL
                AND t.rowid = (SELECT MAX(t2.rowid) FROM 'transaction' t2 WHERE t2.account = t.account)
                AND NOT EXISTS (SELECT 1 FROM account_history h2 WHERE h2.accountid = t.account)
            `;
            // Wrap and apply filters
            let finalQuery = `SELECT * FROM (${baseQuery}) AS combined_history WHERE 1=1`;
            if (from) { finalQuery += ` AND datetime >= ?`; params.push(from); }
            if (to) { finalQuery += ` AND datetime <= ?`; params.push(to); }
            finalQuery += ` ORDER BY accountid ASC, datetime ASC`;
            query = finalQuery;
        }
        // Execute the final query
        try {
            const stmt = db.db.prepare(query); // Use the final constructed query
            const rows = stmt.all(...params);

            // if there is more than one accountid, we need to forcefully interpolate
            let accountids = [...new Set(rows.map(row => row.accountid))];

            if (accountids.length > 1)
                interpolate = true;
            
            // If interpolation is requested, apply it
            // Restore original line:
            res.json(util.normalizeTimeSeries(rows, interpolate))

        } catch (err) {
            logger.error(`Error fetching account history: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    } // End of async handler
);


router.get(
    "/api/account_transaction_volume",
    [
        query("accountid").optional().isString().withMessage("Account ID must be a string"),
        query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
        query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
    ],
    async (req, res) => {
        let db = new BankDatabase();
        let { accountid, from, to } = req.query;

        let params = [];
        let query = `
            SELECT 
                t.account, 
                DATE(t.datetime) AS date, 
                COUNT(*) AS transaction_count 
            FROM 'transaction' t 
            WHERE 1=1
            `;

        // Dynamically build conditions
        if (accountid) {
            query += " AND t.account = ?";
            params.push(accountid);
        }
        if (from) {
            query += " AND t.datetime >= ?";
            params.push(from);
        }
        if (to) {
            query += " AND t.datetime <= ?";
            params.push(to);
        }

        // Final GROUP BY and ORDER BY
        query += " GROUP BY t.account, DATE(t.datetime) ORDER BY date DESC";

        // logger.info(`${query}, ${params}`);

        try {
            const stmt = db.db.prepare(query);
            const rows = stmt.all(...params);
            res.json(rows);
        } catch (err) {
            logger.error(`Error fetching account transaction volume: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    }
);

router.get(
    "/api/account_interest_changes",
    [
        query("accountid").optional().isString().withMessage("Account ID must be a string"),
        query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
        query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
    ],
    async (req, res) => {
        let db = new BankDatabase();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { accountid, from, to } = req.query;
        let params = [];

        let query = `
            WITH InterestChanges AS (
                SELECT historyid,
                    accountid,
                    datetime,
                    json_extract(data, '$.interest') AS interest,
                    LAG(json_extract(data, '$.interest')) OVER (
                        PARTITION BY accountid
                        ORDER BY datetime
                    ) AS previous_interest
                FROM account_history
                WHERE json_extract(data, '$.interest') IS NOT NULL
            ),
            NewestInterest AS (
                SELECT historyid,
                    accountid,
                    datetime,
                    json_extract(data, '$.interest') AS interest,
                    ''
                FROM account_history AS a
                WHERE json_extract(data, '$.interest') IS NOT NULL
                    AND datetime = (
                        SELECT MAX(datetime)
                        FROM account_history AS b
                        WHERE a.accountid = b.accountid
                    )
            )
            SELECT historyid,
                accountid,
                datetime,
                interest
            FROM (
                    SELECT *
                    FROM InterestChanges
                    WHERE interest != previous_interest
                        OR previous_interest IS NULL
                    UNION ALL
                    SELECT *
                    FROM NewestInterest
                )
            WHERE 1 = 1
        `;

        // Apply filters dynamically
        if (accountid) {
            query += " AND accountid = ?";
            params.push(accountid);
        }
        if (from) {
            query += " AND datetime >= ?";
            params.push(from);
        }
        if (to) {
            query += " AND datetime <= ?";
            params.push(to);
        }

        query += " ORDER BY datetime DESC";


        try {
            const stmt = db.db.prepare(query);
            const rows = stmt.all(...params);
            res.json(rows);
        } catch (err) {
            logger.error(`Error executing query: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    }
);

module.exports = router;

/**
 * @swagger
 * /api/account_balance:
 *   post:
 *     summary: Records a new balance for an account at a specific date.
 *     description: Inserts a balance record into the account history table. The balance is recorded with an optional timestamp and metadata.
 *     tags:
 *       - Accounts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountid
 *               - balance
 *             properties:
 *               accountid:
 *                 type: string
 *                 description: The unique ID of the account.
 *                 example: "acc123"
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: The ISO 8601 formatted date-time for the balance entry. Defaults to the current timestamp if not provided.
 *                 example: "2024-02-11T12:00:00Z"
 *               balance:
 *                 type: number
 *                 format: float
 *                 description: The balance of the account at the specified time.
 *                 example: 1000.50
 *               data:
 *                 type: object
 *                 description: Optional metadata associated with the balance entry.
 *                 example: { "note": "Initial deposit" }
 *               is_reference:
 *                 type: boolean
 *                 description: Optional. If true, marks this balance as the reference point, clears all previous history for the account, and triggers recalculation (in Sprint 2). Defaults to false.
 *                 example: true
 *     responses:
 *       201:
 *         description: Balance recorded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 historyid:
 *                   type: integer
 *                   description: The unique ID of the inserted history record.
 *                   example: 42
 *                 message:
 *                   type: string
 *                   example: "Balance recorded"
 *       400:
 *         description: Invalid input, validation errors occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Balance must be a number"
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database error message"
 */
/**
 * @swagger
 * /api/account_history:
 *   get:
 *     summary: Returns historical balances for accounts within a date range.
 *     description: Retrieves balance history for all accounts or a specific account, filtered by an optional date range. If interpolation is requested, an account ID must be provided.
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: query
 *         name: accountid
 *         schema:
 *           type: string
 *         required: false
 *         description: The unique ID of the account. Required if interpolation is enabled.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: The start date for filtering (ISO 8601 format).
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: The end date for filtering (ISO 8601 format).
 *       - in: query
 *         name: interpolate
 *         schema:
 *           type: boolean
 *         required: false
 *         description: If true, interpolates missing data points in the time series. Requires accountid to be specified.
 *     responses:
 *       200:
 *         description: A list of balance history entries, optionally interpolated.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   accountid:
 *                     type: string
 *                     description: The account ID.
 *                   datetime:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the balance entry.
 *                   balance:
 *                     type: number
 *                     description: The balance at the given datetime.
 *       400:
 *         description: Bad Request - Missing required accountid when interpolation is enabled.
 *       500:
 *         description: Internal Server Error.
 */

/**
 * @swagger
 * /api/account_transaction_volume:
 *   get:
 *     summary: Get account transaction volume
 *     description: Returns aggregated transaction volume for a given account, filtered by date range.
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: query
 *         name: accountid
 *         schema:
 *           type: string
 *         required: false
 *         description: The account ID to filter transactions.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: The start date (ISO 8601 format) for filtering transactions.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: The end date (ISO 8601 format) for filtering transactions.
 *     responses:
 *       200:
 *         description: Successful response with transaction volume data.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   account:
 *                     type: string
 *                     description: The account ID.
 *                   date:
 *                     type: string
 *                     format: date
 *                     description: The transaction date.
 *                   transaction_count:
 *                     type: integer
 *                     description: The count of transactions for that date.
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/account_interest_changes:
 *   get:
 *     summary: Retrieve interest rate changes for accounts
 *     description: Fetches interest rate changes, including the first recorded rate, each distinct change, and the latest rate per account. Supports optional filtering by account ID and date range.
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: query
 *         name: accountid
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter results by account ID.
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Filter results from this date (ISO 8601 format).
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Filter results up to this date (ISO 8601 format).
 *     responses:
 *       200:
 *         description: Successfully retrieved interest rate changes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   historyid:
 *                     type: integer
 *                     description: Unique ID for the record.
 *                   accountid:
 *                     type: string
 *                     description: The associated account ID.
 *                   datetime:
 *                     type: string
 *                     format: date-time
 *                     description: Timestamp of the interest rate record.
 *                   interest:
 *                     type: number
 *                     format: float
 *                     description: Interest rate at the time of the record.
 *       400:
 *         description: Invalid request parameters.
 *       500:
 *         description: Internal server error.
 */
