const jwt = require('jsonwebtoken');
const config = require('./Config');
const UserManager = require('./UserManager');
const ApiKeyManager = require('./ApiKeyManager');

class JWTAuthenticator {
  static authenticateToken(globalDisableAuth) {
    return (req, res, next) => {
      if (globalDisableAuth) {
        return next();
      }

      if (!config['jwt']) throw new Error("JWT secret is missing!");

      const authHeader = req.headers['authorization'];
      const apiKey = req.headers['x-api-key']; // Developer API key
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      // Paths to skip authentication
      const skipPaths = ['/api/login', '/api/signup', '/api/docs/'];
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // 1️⃣ Check if the request has an API Key
      if (apiKey) {
        const apiKeyManager = new ApiKeyManager();

        const verifiedKey = apiKeyManager.verifyApiKey(apiKey);
        if (!verifiedKey) {
          return res.status(403).json({ success: false, message: "Invalid API key" });
        }
        
        req.user = { username: verifiedKey.username, keyId: verifiedKey.keyId, type: "developer" };
        return next();
      }

      // 2️⃣ Check if the request has a Bearer Token
      if (!token) {
        return res.sendStatus(401); // No token or API key, unauthorized
      }

      jwt.verify(token, config['jwt'], (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        const username = user?.username;
        const userManager = new UserManager();
        if (!userManager.userExists(username)) {
          return res.sendStatus(401); // Invalid user
        }

        req.user = user; // Add user payload to request
        next(); // Proceed to next middleware
      });
    };
  }
}

module.exports = JWTAuthenticator;
