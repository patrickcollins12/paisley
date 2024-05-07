// jwtMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('./Config');

class JWTAuthenticator {
  static authenticateToken(req, res, next) {
    const JWT_SECRET = config['jwt'] || 'not_sec';

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No token, unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403); // Invalid token
      req.user = user; // Add user payload to request
      next(); // Proceed to next middleware
    });
  }
}

module.exports = JWTAuthenticator;

