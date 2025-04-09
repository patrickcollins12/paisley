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

    // Method removed from class body


// Singleton instance is not created until the first call without a path

/**
 * Recalculates and updates the account_history table for a given account
 * based on its reference balance and subsequent transactions.
 * @param {string} accountid The ID of the account to recalculate.
 * @returns {Promise<void>}
 */
BankDatabase.prototype.recalculateAccountBalances = async function(accountid) {
    // Note: 'this' inside this function refers to the BankDatabase instance
    logger.info(`Starting recalculation for account: ${accountid}`);

    const getReferenceQuery = `SELECT datetime, balance FROM account_history WHERE accountid = ? AND is_reference = TRUE LIMIT 1`;
    const deleteCalculatedQuery = `DELETE FROM account_history WHERE accountid = ? AND is_reference = FALSE`;
    const getTransactionsQuery = `SELECT datetime, credit, debit FROM "transaction" WHERE account = ? ORDER BY datetime ASC`; // Fetch ALL transactions
    const insertHistoryQuery = `INSERT INTO account_history (accountid, datetime, balance, data, is_reference) VALUES (?, ?, ?, ?, ?)`;

    try {
        // 1. Find Reference Balance
        const referenceStmt = this.db.prepare(getReferenceQuery);
        const referenceBalance = referenceStmt.get(accountid);

        if (!referenceBalance) {
            logger.warn(`No reference balance found for account ${accountid}. Skipping recalculation.`);
            return; // Nothing to calculate against
        }

        const { datetime: ref_datetime, balance: ref_balance } = referenceBalance;
        logger.info(`Found reference balance for ${accountid}: ${ref_balance} as of ${ref_datetime}`);

        // Start transaction
        const runRecalculationTransaction = this.db.transaction(() => {

            // 2. Clear Old Calculated Balances
            const deleteStmt = this.db.prepare(deleteCalculatedQuery);
            const deleteResult = deleteStmt.run(accountid);
            logger.info(`Deleted ${deleteResult.changes} old calculated balance(s) for account ${accountid}.`);

            // 3. Fetch ALL Transactions
            const transactionStmt = this.db.prepare(getTransactionsQuery);
            const all_transactions = transactionStmt.all(accountid); // Fetch all, no date filter here
            logger.info(`Found ${all_transactions.length} total transactions for ${accountid}.`);

            // 4. Calculate Balances at specific times (Forward and Backward)
            const balance_at_time = new Map(); // Map<datetime_string, balance>
            balance_at_time.set(ref_datetime, ref_balance); // Initialize with reference point

            // --- Forward Pass ---
            let forward_balance = ref_balance;
            for (const tx of all_transactions) {
                if (tx.datetime < ref_datetime) continue; // Skip transactions before reference

                const net_change = (tx.credit || 0) - (tx.debit || 0);

                // If tx is exactly at ref time, update the balance *at* that time
                if (tx.datetime === ref_datetime) {
                    forward_balance += net_change;
                    balance_at_time.set(tx.datetime, forward_balance);
                } else {
                    // Otherwise, this is the balance *after* the transaction
                    forward_balance += net_change;
                    balance_at_time.set(tx.datetime, forward_balance);
                }
            }

            // --- Backward Pass ---
            let backward_balance = ref_balance;
            // Iterate in reverse through transactions *before* the reference time
            for (let i = all_transactions.length - 1; i >= 0; i--) {
                const tx = all_transactions[i];
                if (tx.datetime >= ref_datetime) continue; // Skip transactions at or after reference

                const net_change = (tx.credit || 0) - (tx.debit || 0);
                // Calculate balance *before* this transaction occurred
                backward_balance -= net_change;
                balance_at_time.set(tx.datetime, backward_balance);
            }

            // 5. Determine Daily Closing Balances
            const daily_closing_balances = new Map(); // Map<date_string, balance>
            const sorted_times = Array.from(balance_at_time.keys()).sort(); // Sort all event times

            for (const time of sorted_times) {
                const dateString = time.substring(0, 10);
                // Store the balance associated with the latest event time for each day
                daily_closing_balances.set(dateString, balance_at_time.get(time));
            }

            // 6. Prepare and Bulk Insert Calculated Balances
            const insertStmt = this.db.prepare(insertHistoryQuery);
            let insertedCount = 0;

            for (const [dateString, balance] of daily_closing_balances.entries()) {
                const endOfDayTimestamp = `${dateString}T23:59:59.999Z`;

                // Avoid re-inserting the reference balance itself if its timestamp matches end-of-day
                // (unlikely but possible if reference was set exactly at 23:59:59.999Z)
                // Also skip if the balance is for the reference date but the timestamp is different
                // because the reference entry already represents that point in time.
                const refDateString = ref_datetime.substring(0, 10);
                if (dateString === refDateString) {
                    logger.debug(`Skipping insert for reference date ${dateString}, already covered by reference entry.`);
                    continue;
                }

                insertStmt.run(
                    accountid,
                    endOfDayTimestamp,
                    balance,
                    JSON.stringify({ source: "recalculated" }),
                    0 // is_reference = false (0)
                );
                insertedCount++;
            }
            logger.info(`Inserted ${insertedCount} calculated daily balance(s) for account ${accountid}.`);

        }); // End of transaction definition

        // Execute the transaction
        runRecalculationTransaction();
        logger.info(`Successfully completed recalculation for account: ${accountid}`);

    } catch (err) {
        logger.error(`Error during recalculation for account ${accountid}: ${err.message}`, err);
        // Error handling: The transaction should automatically roll back on error.
        // Consider re-throwing or handling specific error types if needed.
        throw err; // Re-throw to allow caller (API route) to handle HTTP response
    }
};

module.exports = BankDatabase;