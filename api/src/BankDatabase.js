const Database = require('better-sqlite3');
const config = require('./Config');
const fs = require('fs');

class BankDatabase {

    // if no dbPath if provided, it will load from the config and return a singleton.
    // if you provide a dbPath, it will give you a new BankDatabase Object.
    constructor(dbPath = null) {
        if (!dbPath && BankDatabase.singletonInstance) {
            return BankDatabase.singletonInstance;
        }

        const path = dbPath || config.database;
        try {

            if (!fs.existsSync(path)) {
                // TODO, replace this with a default new empty paisley database
                throw new Error(`Database file not found at path: ${path}`);
            }

            // this.db = new Database(path, {verbose: console.log});
            this.db = new Database(path);
            console.log(`Connected to SQLite database: ${path}`);
        } catch (err) {
            console.error("Connect error: ", err.message);
        }

        if (!dbPath) {
            BankDatabase.singletonInstance = this;
        }
    }
    
}

// Singleton instance is not created until the first call without a path
module.exports = BankDatabase;