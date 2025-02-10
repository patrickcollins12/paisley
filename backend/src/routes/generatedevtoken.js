const express = require('express');
const rateLimit = require('express-rate-limit');
const JWTAuthenticator = require('../JWTAuthenticator.js');
const ApiKeyManager = require('../ApiKeyManager.js');

const router = express.Router();
const apiKeyManager = new ApiKeyManager();

// Rate limiter: Prevent abuse of API key generation
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { success: false, message: "Too many API key requests, try again later" }
});

// Require authentication via Bearer token
router.post('/api/generate-dev-token', rateLimiter, JWTAuthenticator.authenticateToken(false), (req, res) => {

    if (!req.user || !req.user.username) {
        return res.status(401).json({ success: false, message: "Unauthorized 6" });
    }

    const username = req.user.username;
    const { keyId, token } = apiKeyManager.generateApiKey(username);

    res.json({ success: true, keyId, apiToken: token });
});

module.exports = router;
