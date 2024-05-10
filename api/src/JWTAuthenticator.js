// jwtMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('./Config');
const UserManager = require('./UserManager');

class JWTAuthenticator {
  static authenticateToken(req, res, next) {
    const JWT_SECRET = config['jwt'] || 'not_sec';

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No token, unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403); // Invalid token
      const username = user?.username    
      const manager = new UserManager()
      if (! manager.userExists(username)) return res.sendStatus(401); // Invalid user

      req.user = user; // Add user payload to request
      next(); // Proceed to next middleware
    });
  }
}

module.exports = JWTAuthenticator;

