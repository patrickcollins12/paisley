const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserManager = require('../UserManager.js');
const jwt = require('jsonwebtoken');

const config = require('../Config');
const manager = new UserManager(config['users_file'])
const JWT_SECRET = config['jwt'] || 'not_sec'; 

router.post('/signup', [
    body('username').isString().trim().notEmpty(),
    body('password').isLength({ min: 8 }).trim()
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check if the user already exists
    if (manager.users[username]) {
        return res.status(409).json({ success: false, message: 'User already exists' });
    }

    try {
        // Save the new user with a hashed password
        await manager.saveUser(username, password);

        // Generate a JWT for the authenticated user
        // const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        const token = jwt.sign({ username }, JWT_SECRET);

        res.json({ success: true, message: 'User successfully created', token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
    }
});

module.exports = router;

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
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
 *                 example: s3cr3tp4ss
 *     responses:
 *       200:
 *         description: User successfully created
 *       400:
 *         description: Username and password are required
 *       409:
 *         description: User already exists
 *       500:
 *         description: Error creating user
 */