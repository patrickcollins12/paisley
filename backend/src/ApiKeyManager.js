const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./Config');
const logger = require('./Logger');
class ApiKeyManager {

    constructor(configFileName) {

        this.configFileName = configFileName || config['api_keys_file'];
        this.apiKeys = {};
    
        // Load existing users from the configuration file if it exists
        if (this.configFileName) {
            this.loadApiKeys();
        }

    }

    loadApiKeys() {
        if (!this.configFileName) {
            // No config file specified, just use an empty object
            return;
        }
    
        try {
            if (fs.existsSync(this.configFileName)) {
                this.apiKeys = JSON.parse(fs.readFileSync(this.configFileName, 'utf-8'));
            } else {
                logger.warn(`Configuration file '${this.configFileName}' not found. Using empty API keys list.`);
            }
        } catch (error) {
            logger.error(`Error loading API keys from file '${this.configFileName}': ${error.message}`);
            this.apiKeys = {};
        }
    }

    saveApiKeys() {
        try {
            const data = JSON.stringify(this.apiKeys, null, 4);
            fs.writeFileSync(this.configFileName, data, 'utf-8');
        } catch (error) {
            logger.error(`Error saving API keys: ${error.message}`);
        }
    }

    generateApiKey(username) {
        const keyId = crypto.randomBytes(8).toString('hex'); // Generate a unique key ID
        const token = jwt.sign({ username, type: "developer", keyId }, config['jwt']);

        this.apiKeys[token] = { username, keyId };
        this.saveApiKeys();

        return { keyId, token };
    }

    getApiKeys(username) {
        return Object.entries(this.apiKeys)
            .filter(([_, data]) => data.username === username)
            .map(([token, data]) => ({ keyId: data.keyId, token }));
    }

    verifyApiKey(apiKey) {
        return this.apiKeys[apiKey] || null;
    }

    revokeApiKey(apiKey) {
        if (this.apiKeys[apiKey]) {
            delete this.apiKeys[apiKey];
            this.saveApiKeys();
            return true;
        }
        return false;
    }
}

module.exports = ApiKeyManager;
