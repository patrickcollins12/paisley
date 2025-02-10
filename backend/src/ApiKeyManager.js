const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./Config');

class ApiKeyManager {

    constructor(configFileName) {

        if (!configFileName) {
            configFileName = config['api_keys_file']
        }

        this.configFileName = configFileName;
        this.apiKeys = {};

        // Load existing users from the configuration file during initialization
        this.loadApiKeys();
    }

    loadApiKeys() {
        try {
            this.apiKeys = JSON.parse(fs.readFileSync(this.configFileName, 'utf-8'));
        } catch (error) {
            console.warn(`Error loading API keys file: ${error.message}`);
            this.apiKeys = {};

            // If the file doesn't exist or is empty, initialize an empty users object
            if (error.code === 'ENOENT') {
                console.warn(`Configuration file not found in apiKeysFile: '${this.configFileName}'. Initializing empty user list.`);
                this.apiKeys = {};
            } else {
                console.error(`Error loading API Keys from file: ${error.message}`);
            }

        }
    }

    saveApiKeys() {
        try {
            const data = JSON.stringify(this.apiKeys, null, 4);
            fs.writeFileSync(this.configFileName, data, 'utf-8');
        } catch (error) {
            console.error(`Error saving API keys: ${error.message}`);
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
