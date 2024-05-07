const bcrypt = require('bcrypt');
const fs = require('fs');

class UserManager {
    constructor(configFileName) {
        this.configFileName = configFileName;
        this.users = {};

        // Load existing users from the configuration file during initialization
        this.loadUsersFromConfigFile();
    }

    // Load users from the configuration file
    loadUsersFromConfigFile() {
        try {
            const data = fs.readFileSync(this.configFileName, 'utf-8');
            this.users = JSON.parse(data);
        } catch (error) {
            // If the file doesn't exist or is empty, initialize an empty users object
            if (error.code === 'ENOENT') {
                console.warn(`Configuration file not found: ${this.configFileName}, initializing empty user list.`);
                this.users = {};
            } else {
                console.error(`Error loading users from file: ${error.message}`);
            }
        }
    }

    // Save users to the configuration file
    saveUsersToConfigFile() {
        try {
            const data = JSON.stringify(this.users, null, 4);
            fs.writeFileSync(this.configFileName, data, 'utf-8');
        } catch (error) {
            console.error(`Error saving users to file: ${error.message}`);
        }
    }

    // Save a user with a hashed password, then update the config file
    async saveUser(username, password) {
        const hashedPassword = await this.hashPassword(password);
        this.users[username] = hashedPassword;
        this.saveUsersToConfigFile(); // Automatically save changes to file
    }

    // Hash a password using bcrypt
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    // Check if a plain text password matches a stored hashed password
    async checkPassword(username, password) {
        const hashedPassword = this.users[username];
        if (!hashedPassword) {
            return false;
        }
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = UserManager;
