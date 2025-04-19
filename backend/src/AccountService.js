const BankDatabase = require('./BankDatabase');
const logger = require('./Logger.js');

// Remove module-level instance: 
// const dbInstance = new BankDatabase();

class AccountService {

    // --- Constants --- 
    static accountKeys = [
        "institution", "name", "holders", "currency", "type",
        "category", "timezone", "shortname", "parentid", "status", "metadata"
    ];

    // --- SQL Queries (can remain as module-level constants or become static properties) ---
    static baseAccountQuery = `
        SELECT 
            a.accountid, a.institution, a.name, a.holders, a.currency, a.type, a.category, a.timezone, a.shortname, a.parentid, a.status, a.metadata,
            latest_balance.balance,
            latest_balance.datetime as balance_datetime,
            latest_balance.src as balance_source
        FROM 
            account a
        LEFT JOIN (
            SELECT 
                accountid,
                datetime,
                balance,
                src,
                ROW_NUMBER() OVER(PARTITION BY accountid ORDER BY datetime DESC) as rn
            FROM (
                SELECT 
                    accountid,
                    datetime,
                    balance,
                    'account_history' AS src
                FROM 
                    account_history
                WHERE 
                    balance IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    account AS accountid,
                    datetime,
                    balance,
                    'transaction' AS src
                FROM 
                    "transaction"
                WHERE 
                    balance IS NOT NULL
            ) AS combined_balances
        ) AS latest_balance ON a.accountid = latest_balance.accountid AND latest_balance.rn = 1
    `;

    static interestSql = `
        SELECT 
            accountid,
            MAX(datetime) as datetime, 
            json_extract(data, '$.interest') AS interest
        FROM 
            account_history
        WHERE 
            json_extract(data, '$.interest') IS NOT NULL
        GROUP BY 
            accountid
    `;

    // --- Constructor --- 
    constructor() {
        this.db = new BankDatabase();
    }

    // --- Helper Functions (as static methods) --- 

    /**
     * Prepares fields from request body based on allowed keys.
     * @param {object} requestBody - The request body.
     * @returns {Array<{key: string, value: any}>} - Array of key-value pairs.
     */
    static prepareFields(requestBody) {
        let values = [];
        AccountService.accountKeys.forEach((key) => {
            const value = requestBody[key];
            if (value !== undefined) {
                values.push({ key, value: value === "" ? null : value });
            }
        });
        return values;
    }

    /**
     * Recursively searches an array of account objects for a specific ID.
     * @param {Array<object>} accounts - The array of account objects.
     * @param {string} id - The account ID to find.
     * @returns {object|null} The found account object or null.
     */
    static findAccountById(accounts, id) {
        for (const account of accounts) {
            if (account.accountid === id) {
                return account;
            }
            if (account.children && account.children.length > 0) {
                const foundInChildren = AccountService.findAccountById(account.children, id);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }
        return null;
    }

    // --- Internal Helpers for getAllAggregatedSorted (as static methods) --- 

    async _fetchRawAccountsAndInterest() {
        // Use instance db connection
        logger.debug("AccountService: Fetching raw accounts and interest.");
        const rawAccounts = this.db.db.prepare(AccountService.baseAccountQuery).all();
        const rawInterest = this.db.db.prepare(AccountService.interestSql).all();
        logger.debug(`AccountService: Fetched ${rawAccounts?.length || 0} raw accounts and ${rawInterest?.length || 0} interest records.`);
        return { rawAccounts, rawInterest };
    }

    _buildAccountMap(rawAccounts) {
        const accountMap = new Map();
        if (rawAccounts) {
            rawAccounts.forEach(acc => accountMap.set(acc.accountid, { ...acc, children: [], hasChildren: false }));
        }
        logger.debug(`AccountService: Built account map with ${accountMap.size} entries.`);
        return accountMap;
    }

    _aggregateBalances(accountMap) {
        logger.debug("AccountService: Starting balance aggregation.");
        const childBalanceSums = {};
        const childLatestDates = {};
        const parents = new Set();
        accountMap.forEach(account => {
            if (account.parentid && accountMap.has(account.parentid)) {
                const parentId = account.parentid;
                parents.add(parentId);
                childBalanceSums[parentId] = (childBalanceSums[parentId] || 0) + (account.balance || 0);
                const currentLatestDate = childLatestDates[parentId];
                if (account.balance_datetime && (!currentLatestDate || new Date(account.balance_datetime) > new Date(currentLatestDate))) {
                    childLatestDates[parentId] = account.balance_datetime;
                }
            }
        });
        parents.forEach(parentId => {
            const parentAccount = accountMap.get(parentId);
            if (parentAccount) {
                parentAccount.balance = childBalanceSums[parentId] || 0;
                const latestChildDate = childLatestDates[parentId];
                if (latestChildDate && (!parentAccount.balance_datetime || new Date(latestChildDate) > new Date(parentAccount.balance_datetime))) {
                    parentAccount.balance_datetime = latestChildDate;
                }
                parentAccount.hasChildren = true;
            }
        });
        logger.debug(`AccountService: Aggregated balances for ${parents.size} parent accounts.`);
    }

    _buildHierarchyAndSortChildren(accountMap) {
        logger.debug("AccountService: Building hierarchy and sorting children.");
        const hierarchicalAccounts = [];
        accountMap.forEach(account => {
            if (account.parentid && accountMap.has(account.parentid)) {
                const parent = accountMap.get(account.parentid);
                parent.children.push(account);
            } else if (!account.parentid) {
                hierarchicalAccounts.push(account);
            }
        });
        accountMap.forEach(account => {
            if (account.children.length > 1) {
                account.children.sort((a, b) => a.name.localeCompare(b.name));
            }
        });
        logger.debug(`AccountService: Hierarchy built. ${hierarchicalAccounts.length} top-level accounts identified.`);
        return hierarchicalAccounts;
    }

    _mergeInterestData(accountMap, rawInterest) {
        logger.debug("AccountService: Merging interest data.");
        if (!rawInterest || rawInterest.length === 0) {
            logger.debug("AccountService: No interest data to merge.");
            return;
        }
        let mergedCount = 0;
        rawInterest.forEach(intAcc => {
            const account = accountMap.get(intAcc.accountid);
            if (account) {
                account.interest = intAcc.interest;
                account.interest_datetime = intAcc.datetime;
                mergedCount++;
            }
        });
        logger.debug(`AccountService: Merged interest data into ${mergedCount} accounts.`);
    }

    _sortTopLevelAccounts(topLevelAccounts) {
        logger.debug("AccountService: Sorting top-level accounts.");
        const sortOrder = ["Checking", "Savings", "Crypto", "Investment", "Credit", "Mortgage"];
        topLevelAccounts.sort((a, b) => {
            const indexA = sortOrder.indexOf(a.type);
            const indexB = sortOrder.indexOf(b.type);
            const typeOrderA = indexA === -1 ? Infinity : indexA;
            const typeOrderB = indexB === -1 ? Infinity : indexB;
            const typeComparison = typeOrderA - typeOrderB;
            if (typeComparison !== 0) return typeComparison;
            return (b.balance || 0) - (a.balance || 0);
        });
        logger.debug("AccountService: Top-level accounts sorted.");
    }

    // --- Main Service Functions (as Instance methods) --- 

    async getAllAggregatedSorted() {
        // Call internal helper methods using this
        const { rawAccounts, rawInterest } = await this._fetchRawAccountsAndInterest();
        if (!rawAccounts || rawAccounts.length === 0) return [];
        const accountMap = this._buildAccountMap(rawAccounts);
        this._aggregateBalances(accountMap);
        const hierarchicalAccounts = this._buildHierarchyAndSortChildren(accountMap);
        this._mergeInterestData(accountMap, rawInterest);
        this._sortTopLevelAccounts(hierarchicalAccounts);
        logger.debug("AccountService: Returning final processed accounts.");
        return hierarchicalAccounts;
    }

    async getOneAggregated(accountId) {
        logger.debug(`AccountService: Getting single aggregated account for ID: ${accountId}`);
        const allAggregatedAccounts = await this.getAllAggregatedSorted(); // Call instance method
        const account = AccountService.findAccountById(allAggregatedAccounts, accountId); // Call helper
        if (!account) {
            logger.warn(`AccountService: Account ${accountId} not found in aggregated list.`);
            return null;
        }
        logger.debug(`AccountService: Found and returning aggregated account ${accountId}.`);
        return account;
    }

    async getOneWithInterest(accountId) {
        // Use instance db connection
        logger.debug(`AccountService: Fetching account with ID: ${accountId}`);
        const accountQuery = `${AccountService.baseAccountQuery} WHERE a.accountid = ?`;
        const account = this.db.db.prepare(accountQuery).get(accountId);
        if (!account) return null;
        const singleInterestSql = `${AccountService.interestSql} AND accountid = ?`;
        const interest = this.db.db.prepare(singleInterestSql).get(accountId);
        if (interest) {
            account.interest = interest.interest;
            account.interest_datetime = interest.datetime;
        }
        logger.debug(`AccountService: Returning account ${accountId} with interest data.`);
        return account;
    }

    async accountExists(id) {
        // Use instance db connection
        const accountQuery = `select 1 from account WHERE accountid = ? LIMIT 1`;
        const account = this.db.db.prepare(accountQuery).get(id);
        return account !== undefined;
    }

    async createAccount(accountData) {
        const { accountid } = accountData;
        if (!accountid) return { success: false, message: "Account ID is required for creation." };
        const fieldsToProcess = AccountService.prepareFields(accountData);
        if (fieldsToProcess.length === 0) return { success: false, message: "No valid fields provided." };
        const fieldsToInsert = fieldsToProcess.map(f => f.key);
        const valuesToInsert = [accountid, ...fieldsToProcess.map(f => f.value)];
        const placeholders = new Array(fieldsToInsert.length).fill('?').join(', ');
        const columns = ['accountid', ...fieldsToInsert].join(", ");
        const insertQuery = `INSERT INTO account (${columns}) VALUES (?, ${placeholders})`;
        logger.debug(`AccountService: Creating account ${accountid}`);
        try {
            // Use instance db connection
            const stmt = this.db.db.prepare(insertQuery);
            stmt.run(valuesToInsert);
            logger.info(`AccountService: Account ${accountid} created successfully.`);
            return { success: true, message: "Account created successfully", accountid };
        } catch (error) {
            let message = "Database error during account creation.";
            if (error.message && error.message.includes("UNIQUE constraint failed")) {
                message = "Account ID already exists.";
            } else {
                logger.error(`AccountService: Error creating account ${accountid}: ${error.message}`, error);
            }
            if (message === "Account ID already exists.") {
                return { success: false, message: message };
            }
            throw new Error(message);
        }
    }

    async updateAccount(accountId, accountData) {
        const fieldsToProcess = AccountService.prepareFields(accountData);
        if (fieldsToProcess.length === 0) return { success: false, message: "No fields provided." };
        const fieldsToUpdate = fieldsToProcess.map(f => f.key);
        const valuesToUpdate = [...fieldsToProcess.map(f => f.value), accountId];
        const updateFields = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const updateQuery = `UPDATE account SET ${updateFields} WHERE accountid = ?`;
        logger.debug(`AccountService: Updating account ${accountId}`);
        try {
            // Use instance db connection
            const stmt = this.db.db.prepare(updateQuery);
            const result = stmt.run(valuesToUpdate);
            if (result.changes === 0) {
                logger.warn(`AccountService: Account ${accountId} not found or no changes applied.`);
                return { success: false, message: "Account not found or no changes applied." };
            }
            logger.info(`AccountService: Account ${accountId} updated successfully.`);
            return { success: true, message: "Account updated successfully" };
        } catch (error) {
            logger.error(`AccountService: Error updating account ${accountId}: ${error.message}`, error);
            throw new Error("Database error during account update.");
        }
    }

    async deleteAccount(accountId, deleteTransactionsAndHistory) {
        if (typeof deleteTransactionsAndHistory !== 'boolean') {
            throw new Error("deleteTransactionsAndHistory flag (boolean) is required.");
        }
        logger.info(`AccountService: Attempting to delete account ${accountId}. deleteTransactionsAndHistory=${deleteTransactionsAndHistory}`);
 
        try {
            let accountChanges = 0;
            let txnChanges = 0;
            let enrichedChanges = 0;

            if (deleteTransactionsAndHistory) {
                const deleteEnrichedSql = "DELETE FROM transaction_enriched WHERE id IN (SELECT id FROM 'transaction' WHERE account = ?)";
                enrichedChanges = this.db.db.prepare(deleteEnrichedSql).run(accountId).changes;
                logger.debug(`AccountService: Deleted ${enrichedChanges} rows from transaction_enriched.`);

                const deleteTxnSql = "DELETE FROM 'transaction' WHERE account = ?"; // Ensure 'transaction' is quoted if it's a keyword
                txnChanges = this.db.db.prepare(deleteTxnSql).run(accountId).changes;
                logger.debug(`AccountService: Deleted ${txnChanges} rows from transaction.`);
                
                // Note: account_history deletion is handled by CASCADE
            }

            logger.info(`[SERVICE deleteAccount] Attempting DELETE FROM account WHERE accountid = ? with ID: ${accountId}`);
            const deleteAccountSql = "DELETE FROM account WHERE accountid = ?";
            accountChanges = this.db.db.prepare(deleteAccountSql).run(accountId).changes;
            logger.info(`[SERVICE deleteAccount] Result of DELETE FROM account: changes=${accountChanges}`);

            if (accountChanges === 0) {
                logger.warn(`AccountService: Account ${accountId} not found for deletion.`);
                // Throw specific error to be caught below
                throw new Error("Account not found"); 
            }

            // Log success if all steps completed
            logger.info(`AccountService: Account ${accountId} deleted successfully. Changes: account=${accountChanges}, txns=${txnChanges}, enriched=${enrichedChanges}`);
            return { success: true, message: "Account deleted successfully" };

        } catch (error) {
            if (error.message === "Account not found") {
                return { success: false, message: "Account not found" };
            }
            // Log the original error for debugging before throwing the generic one
            logger.error(`AccountService: Original error during account deletion for ${accountId}: ${error.message}`, error.stack); 
            // Re-throw the original error for clearer test failures during debugging
            // throw new Error("Database error during account deletion."); 
            throw error; 
        }
    }
}

module.exports = AccountService; 