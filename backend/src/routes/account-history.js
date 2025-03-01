const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const BankDatabase = require("../BankDatabase"); // Adjust the path as necessary

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

            console.error("Error inserting balance:", err.message);

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
                        balance
                        --, 'account_history' as source
                    FROM 
                        account_history 

                UNION

                    -- get the latest transaction for each account
                    -- this assumes that the latest transaction is the most recent balance
                    -- this is why CSV's need to be imported in ascending order

                    SELECT 
                        t.account,
                        t.datetime,
                        t.balance
                        -- , 'transaction' as source
                    FROM 'transaction' t
                    WHERE t.rowid = (
                            SELECT 
                                MAX(t2.rowid)
                                FROM 'transaction' t2
                                WHERE t2.account = t.account
                                    AND t2.datetime = t.datetime
                        )
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
            console.error("Error fetching account history:", err.message);
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