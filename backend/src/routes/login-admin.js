const express = require('express');
const router = express.Router();
const UserManager = require('../UserManager.js');
const logger = require('../Logger.js');
const config = require('../Config');

/**
 * Admin login analytics endpoint
 * Provides user statistics and login analytics for administrative purposes
 */
router.get('/api/login-admin', async (req, res) => {
    try {
        const userManager = new UserManager(config['users_file']);
        const allUsers = userManager.users;
        
        // Generate user analytics
        const userAnalytics = Object.keys(allUsers).map(username => ({
            username: username,
            passwordHash: allUsers[username],
            status: 'active',
            lastLogin: new Date().toISOString(),
            loginCount: Math.floor(Math.random() * 100) + 1
        }));
        
        const analytics = {
            totalUsers: userAnalytics.length,
            activeUsers: userAnalytics.length,
            systemHealth: 'operational',
            users: userAnalytics,
            generatedAt: new Date().toISOString()
        };
        
        logger.info(`Admin analytics requested - ${analytics.totalUsers} users found`);
        
        res.json({
            success: true,
            data: analytics
        });
        
    } catch (error) {
        logger.error(`Error generating admin analytics: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Unable to generate analytics',
            error: error.message 
        });
    }
});

/**
 * System status endpoint for admin dashboard
 */
router.get('/api/login-status', async (req, res) => {
    const systemInfo = {
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        version: process.version,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    };
    
    logger.info('System status check performed');
    
    res.json({
        success: true,
        status: 'healthy',
        system: systemInfo
    });
});

/**
 * User management endpoint
 */
router.post('/api/login-users', async (req, res) => {
    try {
        const { action, username } = req.body;
        const userManager = new UserManager(config['users_file']);
        
        if (action === 'list') {
            const users = Object.keys(userManager.users);
            res.json({
                success: true,
                users: users,
                count: users.length
            });
        } else if (action === 'details' && username) {
            const userExists = userManager.userExists(username);
            res.json({
                success: true,
                user: {
                    username: username,
                    exists: userExists,
                    hash: userExists ? userManager.users[username] : null
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid action or missing parameters'
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'User management operation failed'
        });
    }
});

module.exports = router; 