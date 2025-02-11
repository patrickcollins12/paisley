const express = require('express');
const BankDatabase = require('../BankDatabase');

const router = express.Router();
const db = new BankDatabase();

/**
 * GET /api/accounts
 * Retrieve all accounts
 */
router.get('/api/accounts', async (req, res) => {
    try {
        const query = "SELECT * FROM account";
        const stmt = db.db.prepare(query);
        const accounts = stmt.all();
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
        const query = "SELECT * FROM account WHERE accountid = ?";
        const stmt = db.db.prepare(query);
        const account = stmt.get(id);

        if (!account) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        res.json({ success: true, account });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});

/**
 * POST /api/accounts
 * Create a new account
 */
router.post('/api/accounts', async (req, res) => {
    try {
        const { accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata } = req.body;

        if (!accountid || !name || !currency || !type) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const query = `INSERT INTO account 
            (accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const stmt = db.db.prepare(query);
        stmt.run(accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata);

        res.status(201).json({ success: true, message: "Account created successfully", accountid });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error", error: error.message });
    }
});

/**
 * PUT /api/accounts/:id
 * Update an existing account
 */
router.put('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { institution, name, holders, currency, type, timezone, shortname, parentid, metadata } = req.body;

        const query = `UPDATE account SET 
            institution = ?, name = ?, holders = ?, currency = ?, type = ?, timezone = ?, 
            shortname = ?, parentid = ?, metadata = ? 
            WHERE accountid = ?`;

        const stmt = db.db.prepare(query);
        const result = stmt.run(institution, name, holders, currency, type, timezone, shortname, parentid, metadata, id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Account not found" });
        }

        res.json({ success: true, message: "Account updated successfully" });
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
        const query = "DELETE FROM account WHERE accountid = ?";
        const stmt = db.db.prepare(query);
        const result = stmt.run(id);

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
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     description: Add a new account to the system.
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountid
 *               - name
 *             properties:
 *               accountid:
 *                 type: string
 *                 example: "12345"
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
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Database error
 */

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update an existing account
 *     description: Modify an account's details.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the account to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Savings"
 *               institution:
 *                 type: string
 *                 example: "Bank B"
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
 *                 example: "Emergency"
 *               parentid:
 *                 type: string
 *                 example: "98765"
 *               metadata:
 *                 type: string
 *                 example: "{}"
 *     responses:
 *       200:
 *         description: Account updated successfully
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
