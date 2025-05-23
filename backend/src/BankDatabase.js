const Database = require('better-sqlite3');
const config = require('./Config');
config.load()

const fs = require('fs');
const logger = require('./Logger');

class BankDatabase {

    // if no dbPath if provided, it will load from the config and return a singleton.
    // if you provide a dbPath, it will give you a new BankDatabase Object.
    constructor(dbPath = null) {

        if (!dbPath && BankDatabase.singletonInstance) {
            return BankDatabase.singletonInstance;
        }
        const path = dbPath || config.database;
        try {
            if (path == ":memory:") {
                // great, let's proceed
            }

            // if file based, check the path exists
            else if (!fs.existsSync(path)) {
                // TODO, replace this with a default new empty paisley database
                throw new Error(`Database file not found at path: ${path}`);
            }

            // Enable this to turn on logging:
            // this.db = new Database(path, {verbose: logger.info});
            this.db = new Database(path);

            // this.db = this.createDbProxy(this.db);

            BankDatabase.singletonInstance = this;
            
            this.addRegex()
            this.regexCache = new Map();  // Cache for storing compiled regex objects
            
            logger.info(`Connected to SQLite database: ${path}`);
        } catch (err) {
            logger.error(`Connect error: ${err}`);
        }

        // if (!dbPath) {
        // }

    }


    // FAILED EXPERIMENT TO PROXY DB TO PRINT OUT THE PARAMS
    // createDbProxy(db) {
    //     const self = this;
    //     return new Proxy(db, {
    //         get(target, property, receiver) {
    //             const original = Reflect.get(target, property, receiver);
    //             if (typeof original === 'function') {
    //                 return function (...args) {
    //                     const context = this === receiver ? target : this;  // Ensure correct 'this' context
    //                     const result = original.apply(context, args);  // Apply using correct context

    //                     // Handle Statement objects and transactions specifically
    //                     if (property === 'prepare' && typeof result === 'object') {
    //                         return self.createDbProxy(result);
    //                     }
    //                     if (property === 'transaction' && typeof result === 'function') {
    //                         return self.createTransactionProxy(result);
    //                     }

    //                     // Clear regex cache for direct db method calls like exec, run
    //                     if (['exec', 'run', 'prepare'].includes(property)) {
    //                         self.regexCache.clear();
    //                     }

    //                     return result;
    //                 };
    //             }
    //             return original;
    //         }
    //     });
    // }

    // createTransactionProxy(transaction) {
    //     const self = this;
    //     return function (...args) {
    //         const transactionResult = transaction.apply(this, args);
    //         self.regexCache.clear();  // Clear cache after transaction execution
    //         return transactionResult;
    //     };
    // }

    addRegex() {

        // Add a custom a function to sqlite.
        // description REGEXP 'myregex/i'
        // description REGEXP '/myregex/i'
        // description REGEXP 'myregex/i'
        // it will cache the regex into the regexCache set
        this.db.function('REGEXP', (pattern, value) => {
            // Attempt to retrieve the regex, or undefined if not present
            let regex = this.regexCache.get(pattern);

            if (regex === undefined) {  // If the pattern is not in the cache
                try {

                    // optionally accept flags at the end of the regex
                    // like /myregex/i or myregex/gim
                    const flagMatch = /\/([a-z]*)$/.exec(pattern);
                    const flags = flagMatch ? flagMatch[1] : '';

                    let regexPattern = flagMatch ? pattern.slice(0, flagMatch.index) : pattern;

                    // strip a leading / if it exists
                    const stripCharacter = (str, char) => str.startsWith(char) ? str.slice(1) : str;
                    regexPattern = stripCharacter(regexPattern, '/');  // Output: 'example'

                    // logger.info(`>>pattern: ${pattern}`)
                    // logger.info(`>>regexPattern: ${regexPattern}`)

                    regex = new RegExp(regexPattern, flags);  // Try compiling the regex
                    this.regexCache.set(pattern, regex);      // Cache the compiled regex

                } catch (e) {
                    this.regexCache.set(pattern, null);  // Cache the failure state
                    throw new Error("Regex error [E10001]: " + e.message)
                }
            }

            if (regex === null) return 0;  // Return 0 if regex compilation failed

            // Return 1 if the value matches the regex, else 0
            return regex.test(value) ? 1 : 0;
        });
    }
}
    


// Singleton instance is not created until the first call without a path
module.exports = BankDatabase;