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
    ],
    handleValidationErrors,
    async (req, res) => {
        let db = new BankDatabase();
        const { accountid, datetime = new Date().toISOString(), balance, data = {} } = req.body;

        const query = `INSERT INTO account_history (accountid, datetime, balance, data) VALUES (?, ?, ?, ?)`;

        try {
            const stmt = db.db.prepare(query);
            const result = stmt.run(accountid, datetime, balance, JSON.stringify(data));
            res.status(201).json({ historyid: result.lastInsertRowid, message: "Balance recorded" });
        } catch (err) {

            logger.error(`Error inserting balance: ${err.message}`);

            if (err.message.includes("FOREIGN KEY constraint failed")) {
                return res.status(400).json({ error: `Account ID '${accountid}' does not exist.` });
            }

            res.status(500).json({ error: err.message });
        }
    }
);

router.get(
    "/api/account_history",
    [
        query("accountid").optional().isString().withMessage("Account ID must be a string"),
        query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
        query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
    ],
    async (req, res) => {
        let db = new BankDatabase();
        let { accountid, from, to } = req.query;

        let query = `
                -- balance can come from account_history or transaction table
                -- which is why we use a UNION to combine the two
                SELECT DISTINCT * FROM (

                    SELECT 
                        accountid, 
                        datetime, 
                        balance,
                        data,
                        'account_history' as source
                    FROM 
                        account_history 

                UNION

                    -- get the latest transaction for each account
                    -- this assumes that the latest transaction is the most recent balance
                    -- this is why CSV's need to be imported in ascending order

                    SELECT 
                        t.account,
                        t.datetime,
                        t.balance,
                        null,
                        'transaction' as source
                    FROM 'transaction' t
                    WHERE t.rowid = (
                            SELECT 
                                MAX(t2.rowid)
                                FROM 'transaction' t2
                                WHERE t2.account = t.account
                                    AND t2.datetime = t.datetime
                        ) AND balance is not null
                ) WHERE 1=1
                `;
        let params = [];

        if (accountid) {
            query += ` AND accountid = ?`;
            params.push(accountid);
        }
        if (from) {
            query += ` AND datetime >= ?`;
            params.push(from);
        }
        if (to) {
            query += ` AND datetime <= ?`;
            params.push(to);
        }
        query += ` ORDER BY accountid ASC, datetime ASC`;

        try {
            const stmt = db.db.prepare(query);
            const rows = stmt.all(...params);
            res.json(rows);
        } catch (err) {
            logger.error(`Error fetching account history: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    }
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
 *     description: Retrieves balance history for all accounts or a specific account, filtered by an optional date range.
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: query
 *         name: accountid
 *         schema:
 *           type: string
 *         required: false
 *         description: The unique ID of the account. If omitted, data for all accounts is returned.
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
 *     responses:
 *       200:
 *         description: A list of balance history entries.
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
