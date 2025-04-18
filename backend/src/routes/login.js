const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserManager = require('../UserManager.js');
const jwt = require('jsonwebtoken');
var util = require('util')
const logger = require('../Logger.js');
const config = require('../Config');
const disableAuth = true; // false means apply auth, true means disable auth

// Set up rate limiter: maximum of five requests per minute
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    handler: (req, res, next, options) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        logger.error(`Login rate limit reached. From IP: ${ip}. Message: ${JSON.stringify(options.message)}.`)
        res.status(options.statusCode).send(options.message)
    },
    message: {
        success: false,
        message: "Too many login attempts from this IP, please try again after a minute"
    }
});

router.post('/api/login', rateLimiter, [
    body('username').isString().trim().notEmpty().withMessage('Username is required'),
    body('password').isString().trim().notEmpty().withMessage('Password is required')
], async (req, res) => {

    const JWT_SECRET = config['jwt'];
    if (!JWT_SECRET) throw new Error("Missing required 'jwt' secret.");
    
    const manager = new UserManager(config['users_file'])

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check if the username and password match
    const isAuthenticated = await manager.checkPassword(username, password);

    if (isAuthenticated) {
        // Generate a JWT for the authenticated user
        // const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        const token = jwt.sign({ username }, JWT_SECRET);
        logger.info(`User ${username} logged in successfully.`);
        res.json({ success: true, token });
    } else {
        logger.info(`Failed login attempt for user ${username}.`);
        // Authentication failed
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

module.exports = router;

/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: Log in a user with their credentials
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Successful login with JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated access
 *       400:
 *         description: Bad request with validation errors
 *       401:
 *         description: Invalid username or password
 */
