const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserManager = require('../UserManager.js');
const jwt = require('jsonwebtoken');

const config = require('../Config');

router.post('/login', [
    body('username').isString().trim().notEmpty().withMessage('Username is required'),
    body('password').isString().trim().notEmpty().withMessage('Password is required')
], async (req, res) => {

    const JWT_SECRET = config['jwt'] || 'not_sec';
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

        res.json({ success: true, token });
    } else {
        // Authentication failed
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

module.exports = router;


/**
 * @openapi
 * /login:
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
