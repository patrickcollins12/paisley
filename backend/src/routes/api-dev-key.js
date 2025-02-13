const express = require('express');
// const JWTAuthenticator = require('../JWTAuthenticator.js');
const ApiKeyManager = require('../ApiKeyManager.js');

const router = express.Router();
const apiKeyManager = new ApiKeyManager();

const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

const disableAuth = false; // false means apply auth, true means disable auth

/**
 * GET /api/dev-key
 * List all API keys for the authenticated user
 */
router.get('/api/dev-key', (req, res) => {
    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const username = req.user.username;
    const keys = apiKeyManager.getApiKeys(username);

    res.json({ success: true, keys });
});

/**
 * GET /api/dev-key/:id
 * Get a specific API key by keyId (optional)
 */
router.get('/api/dev-key/:id',  (req, res) => {
    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const username = req.user.username;
    const keyId = req.params.id;
    const keys = apiKeyManager.getApiKeys(username);

    const key = keys.find(k => k.keyId === keyId);
    if (!key) {
        return res.status(404).json({ success: false, message: "API key not found" });
    }

    res.json({ success: true, key });
});

/**
 * POST /api/dev-key
 * Generate a new API key for the authenticated user
 */
router.post('/api/dev-key', (req, res) => {
    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const username = req.user.username;
    const { keyId, token } = apiKeyManager.generateApiKey(username);

    res.json({ success: true, keyId, apiToken: token });
});

/**
 * DELETE /api/dev-key/:id
 * Revoke a specific API key by keyId
 */
router.delete('/api/dev-key/:id', (req, res) => {
    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const username = req.user.username;
    const keyId = req.params.id;
    const keys = apiKeyManager.getApiKeys(username);

    const key = keys.find(k => k.keyId === keyId);
    if (!key) {
        return res.status(404).json({ success: false, message: "API key not found" });
    }

    const revoked = apiKeyManager.revokeApiKey(key.token);
    if (revoked) {
        return res.json({ success: true, message: "API key revoked" });
    } else {
        return res.status(500).json({ success: false, message: "Failed to revoke API key" });
    }
});

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Developer API Keys
 *   description: Manage API keys for authenticated developers
 */

/**
 * @swagger
 * /api/dev-key:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     description: Retrieves all API keys associated with the authenticated user.
 *     tags: [Developer API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       keyId:
 *                         type: string
 *                         example: "d4e5f6a7"
 *                       token:
 *                         type: string
 *                         example: "long-lived-jwt-token-1"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */

/**
 * @swagger
 * /api/dev-key/{id}:
 *   get:
 *     summary: Get a specific API key
 *     description: Retrieves a specific API key by its key ID.
 *     tags: [Developer API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the API key to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 key:
 *                   type: object
 *                   properties:
 *                     keyId:
 *                       type: string
 *                       example: "d4e5f6a7"
 *                     token:
 *                       type: string
 *                       example: "long-lived-jwt-token-1"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: API key not found
 */

/**
 * @swagger
 * /api/dev-key:
 *   post:
 *     summary: Generate a new API key
 *     description: Creates a new API key for the authenticated user.
 *     tags: [Developer API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: API key successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 keyId:
 *                   type: string
 *                   example: "e7f8g9h0"
 *                 apiToken:
 *                   type: string
 *                   example: "long-lived-jwt-token-3"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */

/**
 * @swagger
 * /api/dev-key/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     description: Deletes a specific API key by its key ID.
 *     tags: [Developer API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the API key to revoke
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key successfully revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API key revoked"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: API key not found
 */

