const express = require("express");
const router = express.Router();
const { body, query, validationResult, param } = require("express-validator");
const AccountHistory = require("../AccountHistory");
const BalanceHistoryRecreator = require("../BalanceHistoryRecreator");
const logger = require("../Logger");

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

router.post(
    "/api/account_balance",
    [
        body("accountid").isString().notEmpty().withMessage("Account ID is required"),
        body("datetime").optional().isISO8601().withMessage("Invalid datetime format"),
        body("balance").isFloat().withMessage("Balance must be a number"),
        body("data").optional().isObject().withMessage("Metadata must be a JSON object"),
        body("recreate_history").optional().isBoolean().withMessage("recreate_history must be a boolean")
    ],
    handleValidationErrors,
    async (req, res) => {
        const {
            accountid,
            datetime = new Date().toISOString(),
            balance,
            data = {},
            recreate_history = false
        } = req.body;

        try {
            // First record the new balance
            const result = await AccountHistory.recordBalance(accountid, datetime, balance, data);
            // If requested, recreate the balance history
            if (recreate_history) {
                logger.info(`Manual balance added for ${accountid} at ${datetime}. Triggering FULL history recreation.`);
                // Create an instance (constructor args might not be strictly needed for full recalc)
                const recreator = new BalanceHistoryRecreator(accountid, datetime, balance);
                // Call the full recreation method, passing the same recordBalance function
                await recreator.recreateFullAccountHistory(AccountHistory.recordBalance);
            }

            res.status(201).json(result);
        } catch (err) {
            if (err.message.includes("Account ID")) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }
);

// New route for triggering full history recreation
router.post(
    "/api/account_history/:accountid/recreate",
    [
        param("accountid").isString().notEmpty().withMessage("Account ID URL parameter is required")
    ],
    handleValidationErrors, // Reuse validation error handler
    async (req, res) => {
        const { accountid } = req.params;

        // !!! IMPORTANT: Add authorization check here! !!!
        // Verify the logged-in user has permission to modify this accountid
        // Example (pseudo-code):
        // if (!await Permissions.canUserModifyAccount(req.user.id, accountid)) {
        //     return res.status(403).json({ error: "Forbidden" });
        // }

        try {
            logger.info(`Triggering FULL history recreation for account ${accountid} via dedicated route.`);
            
            // Create an instance - constructor args aren't needed for full recalc logic itself,
            // but accountid is needed for DB operations within the instance methods.
            const recreator = new BalanceHistoryRecreator(accountid, null, null); 
            
            // Call the full recreation method, passing the static recordBalance function
            await recreator.recreateFullAccountHistory(AccountHistory.recordBalance);
            
            // Send success response
            res.status(200).json({ message: `History recreation initiated for account ${accountid}` });

        } catch (err) {
            logger.error(`Error during full history recreation trigger for account ${accountid}: ${err.message}`, err);
            // Specific error check if needed (e.g., account not found during recreation)
            // if (err.message.includes("Account not found")) { // Example
            //     return res.status(404).json({ error: err.message });
            // }
            res.status(500).json({ error: "Failed to recreate account history." });
        }
    }
);

router.get(
    "/api/account_history",
    [
        query("accountid").optional().isString().withMessage("Account ID must be a string"),
        query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
        query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
        query("interpolate").optional().toBoolean(),
    ],
    async (req, res) => {
        const { accountid, from, to, interpolate = false } = req.query;

        try {
            const result = await AccountHistory.getAccountHistory(accountid, from, to, interpolate);
            res.json(result);
        } catch (err) {
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
        const { accountid, from, to } = req.query;

        try {
            const result = await AccountHistory.getTransactionVolume(accountid, from, to);
            res.json(result);
        } catch (err) {
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
        const { accountid, from, to } = req.query;

        try {
            const result = await AccountHistory.getInterestChanges(accountid, from, to);
            res.json(result);
        } catch (err) {
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

/**
 * @swagger
 * /api/account_history/{accountid}/recreate:
 *   post:
 *     summary: Triggers a full recalculation of the account history.
 *     description: Initiates a full recalculation of the specified account's history based on its transactions and existing manual balance points (anchor points). Deletes all previously calculated 'recreation' entries and replaces them.
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: accountid
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the account whose history should be recreated.
 *     responses:
 *       200:
 *         description: History recreation initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "History recreation initiated for account acc123"
 *       400:
 *         description: Invalid input (e.g., missing or invalid accountid format).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors: 
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Forbidden - User does not have permission to modify this account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Server error during history recreation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to recreate account history."
 */

module.exports = router;