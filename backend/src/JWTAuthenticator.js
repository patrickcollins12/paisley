// jwtMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('./Config');
const UserManager = require('./UserManager');

class JWTAuthenticator {
  static authenticateToken(globalDisableAuth) {
    return (req, res, next) => {
      if (globalDisableAuth) {
        return next();
      }

      const JWT_SECRET = config['jwt'] || 'not_sec';
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      // Paths to skip authentication
      const skipPaths = ['/api/login', '/api/signup', '/api/docs/'];
      
      // Check if the request path should skip authentication
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      if (token == null) return res.sendStatus(401); // No token, unauthorized

      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        const username = user?.username;
        const manager = new UserManager();
        if (!manager.userExists(username)) return res.sendStatus(401); // Invalid user

        req.user = user; // Add user payload to request
        next(); // Proceed to next middleware
      });
    };
  }
}

module.exports = JWTAuthenticator;
