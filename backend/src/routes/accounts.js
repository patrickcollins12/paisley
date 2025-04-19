const express = require('express');
const { body, query, validationResult, matchedData } = require('express-validator');
// Removed: const BankDatabase = require('../BankDatabase');
// Import accountKeys if needed for validation setup
// const { getAllAggregatedSorted, getOneAggregated, accountExists, createAccount, updateAccount, deleteAccount, accountKeys } = require('../AccountService'); 
const AccountService = require('../AccountService');
const logger = require('../Logger.js');

const router = express.Router();
// Removed: const dbInstance = new BankDatabase();

// Instantiate the service once for this router
const accountService = new AccountService();

// Define validation rules using imported accountKeys
// Keep static access for keys: 
// const validationRules = AccountService.accountKeys.map(key => body(key).optional().trim()); 
// OR if accountKeys might change per instance (unlikely but possible)
const validationRules = accountService.constructor.accountKeys.map(key => body(key).optional().trim());

// --- Route Handlers --- 

router.get('/api/accounts', async (req, res) => {
    try {
        // Call instance method
        const accounts = await accountService.getAllAggregatedSorted();
        res.json({ success: true, account: accounts });
    } catch (error) {
        logger.error(`Error in GET /api/accounts handler: ${error.message}`, error);
        // Use a more generic error message unless specific handling is needed
        res.status(500).json({ success: false, message: "Error fetching accounts" });
    }
});

router.get('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Call instance method
        const account = await accountService.getOneAggregated(id);

        if (!account) {
            // Service function returns null if not found
            return res.status(404).json({ success: false, message: "Account not found" });
        }
        // Return the found account object
        res.json({ success: true, account });
    } catch (error) {
        logger.error(`Error in GET /api/accounts/:id handler: ${error.message}`, error);
        res.status(500).json({ success: false, message: "Error fetching account" });
    }
});

router.post('/api/accounts', validationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    // Account ID validation could also be moved to the service, but keeping it here is fine
    if (!req.body.accountid) {
        return res.status(400).json({ success: false, message: "Account ID is required for creation." });
    }

    // if account exists, use instance method
    if (await accountService.accountExists(req.body.accountid)) {
        return res.status(400).json({ success: false, message: "Account ID already exists." });
    }

    try {
        // Call instance method
        const result = await accountService.createAccount(req.body);
        if (result.success) {
            // Use 201 for created, include accountid
            res.status(201).json(result);
        } else {
            // Service handles UNIQUE constraint, return 400 for that or other specific validation failures
            res.status(400).json(result);
        }
    } catch (error) {
        // Catch errors re-thrown by the service (unexpected DB errors)
        logger.error(`Error in POST /api/accounts handler: ${error.message}`, error);
        res.status(500).json({ success: false, message: "Error creating account" });
    }
});

router.patch('/api/accounts/:id', validationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { id } = req.params;
        // Call instance method
        const result = await accountService.updateAccount(id, req.body);
        if (result.success) {
            res.json(result);
        } else {
            // Service returns success: false if not found or no fields
            const statusCode = result.message.includes("not found") ? 404 : 400;
            res.status(statusCode).json(result);
        }
    } catch (error) {
        // Catch errors re-thrown by the service
        logger.error(`Error in PATCH /api/accounts/:id handler: ${error.message}`, error);
        res.status(500).json({ success: false, message: "Error updating account" });
    }
});



// Define validation rules specifically for the DELETE route
const deleteTransactionsAndHistoryRules = [
    query('deleteTransactionsAndHistory')
        .exists().withMessage('deleteTransactionsAndHistory query parameter is required.')
        .isBoolean().withMessage('deleteTransactionsAndHistory must be a boolean (true or false).')
        .toBoolean() // Convert validated string ('true', 'false') to boolean
];

router.delete('/api/accounts/:id', deleteTransactionsAndHistoryRules, async (req, res) => {
    // --- Standard validation error check ---
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    // --- End validation error check ---

    try {
        const { id } = req.params;

        // Use matchedData to get the validated & sanitized boolean value
        const validatedQueryData = matchedData(req, { locations: ['query'] });
        const deleteTransactionsAndHistory = validatedQueryData.deleteTransactionsAndHistory;

        // Call instance method with the flag
        const result = await accountService.deleteAccount(id, deleteTransactionsAndHistory);

        if (!result.success) {
            // Service handles not found case
            return res.status(404).json(result);
        }
        res.json(result); // Contains { success: true, message: "..." }

    } catch (error) {
        // Catch errors re-thrown by the service
        logger.error(`Error in DELETE /api/accounts/:id handler: ${error.message}`, error);
        res.status(500).json({ success: false, message: "Error deleting account" });
    }
});

// Removed helper functions: prepareFields, insertAccount, updateAccount
// Removed constant: accountKeys (now imported)
// Removed function: handleAccountAction

module.exports = router;

// --- Swagger Definitions --- 

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: API for managing accounts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountBase:
 *       type: object
 *       properties:
 *         accountid: { type: string, format: uuid, description: "Unique identifier for the account" }
 *         institution: { type: string, nullable: true, description: "Financial institution name" }
 *         name: { type: string, description: "Account name" }
 *         holders: { type: string, nullable: true, description: "Account holder names" }
 *         currency: { type: string, description: "ISO currency code (e.g., USD)" }
 *         type: { type: string, description: "Account type (e.g., Checking, Savings, Credit)" }
 *         category: { type: string, nullable: true, description: "User-defined category" }
 *         timezone: { type: string, nullable: true, description: "Account timezone" }
 *         shortname: { type: string, nullable: true, description: "Short alias for the account" }
 *         parentid: { type: string, format: uuid, nullable: true, description: "ID of the parent account, if any" }
 *         status: { type: string, nullable: true, description: "Account status (e.g., active, closed)" }
 *         metadata: { type: string, nullable: true, description: "JSON string for additional metadata" }
 *     AccountWithBalance:
 *       allOf:
 *         - $ref: '#/components/schemas/AccountBase'
 *         - type: object
 *           properties:
 *             balance: { type: number, nullable: true, description: "Latest known balance" }
 *             balance_datetime: { type: string, format: date-time, nullable: true, description: "Timestamp of the latest balance" }
 *             balance_source: { type: string, nullable: true, description: "Source of the latest balance ('account_history' or 'transaction')" }
 *             interest: { type: number, nullable: true, description: "Latest known interest rate" }
 *             interest_datetime: { type: string, format: date-time, nullable: true, description: "Timestamp of the latest interest rate" }
 *     AggregatedAccount:
 *       allOf:
 *         - $ref: '#/components/schemas/AccountWithBalance'
 *         - type: object
 *           properties:
 *             hasChildren: { type: boolean, description: "Indicates if this account has children (for aggregated balance)" }
 *             children: 
 *               type: array
 *               description: "Child accounts (only present for top-level accounts)"
 *               items: 
 *                 $ref: '#/components/schemas/AccountWithBalance' # Children won't have their own children nested further
 *     AccountInput:
 *       type: object
 *       required:
 *         - accountid # Assuming accountid is required on creation based on previous logic
 *         - name
 *         - currency
 *         - type
 *       properties:
 *         accountid: { type: string, format: uuid }
 *         institution: { type: string, nullable: true }
 *         name: { type: string }
 *         holders: { type: string, nullable: true }
 *         currency: { type: string, example: "USD" }
 *         type: { type: string, example: "Checking" }
 *         category: { type: string, nullable: true }
 *         timezone: { type: string, nullable: true }
 *         shortname: { type: string, nullable: true }
 *         parentid: { type: string, format: uuid, nullable: true }
 *         status: { type: string, nullable: true }
 *         metadata: { type: string, nullable: true, description: "JSON string" }
 *     AccountUpdateInput:
 *       type: object
 *       description: "Provide only the fields you want to update."
 *       properties:
 *         institution: { type: string, nullable: true }
 *         name: { type: string }
 *         holders: { type: string, nullable: true }
 *         currency: { type: string, example: "USD" }
 *         type: { type: string, example: "Checking" }
 *         category: { type: string, nullable: true }
 *         timezone: { type: string, nullable: true }
 *         shortname: { type: string, nullable: true }
 *         parentid: { type: string, format: uuid, nullable: true }
 *         status: { type: string, nullable: true }
 *         metadata: { type: string, nullable: true, description: "JSON string" }
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string }
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string }
 *         errors: { type: array, items: { type: object }, nullable: true, description: "Validation errors, if any" }
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Retrieve all accounts (aggregated and sorted)
 *     description: Fetch a list of all top-level accounts, with child balances aggregated into parents, sorted by type and balance. Includes latest interest data where available.
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of aggregated accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 account: # Renamed from 'account' to match response key
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AggregatedAccount'
 *       500:
 *         description: Server error fetching accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Retrieve a single account by ID
 *     description: Fetch a specific account by its ID, including latest balance and interest data.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the account to retrieve.
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 account:
 *                   $ref: '#/components/schemas/AccountWithBalance'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error fetching account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     description: Create a new financial account.
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountInput'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     accountid: { type: string, format: uuid }
 *       400:
 *         description: Invalid input data (e.g., missing required fields, validation error, duplicate accountid)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error creating account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   patch:
 *     summary: Update an existing account
 *     description: Update specific fields of an existing account by its ID.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the account to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountUpdateInput'
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input data or no fields provided for update.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error updating account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     description: Remove an account from the system by its ID.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the account to delete.
 *       - in: query
 *         name: deleteTransactionsAndHistory
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Set to true to also delete associated transactions and history.
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error deleting account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
