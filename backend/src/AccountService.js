const BankDatabase = require('./BankDatabase');
const logger = require('./Logger.js');

// --- Database Instance --- 
// Create a single instance to be used by the service functions
const dbInstance = new BankDatabase();
// Ensure proper cleanup if the application lifecycle allows
// process.on('exit', () => dbInstance.close()); 
// process.on('SIGINT', () => dbInstance.close());

// --- Constants --- 
const accountKeys = [
    "institution", "name", "holders", "currency", "type", "category", "timezone", "shortname", "parentid", "status", "metadata"
];

// --- SQL Queries --- 
// SQL query to get accounts joined with their own latest balance entry
const baseAccountQuery = `
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
`; // Note: Removed WHERE 1=1, will add specific filters later

// SQL query to get latest interest rate per account
const interestSql = `
SELECT 
    accountid,
    MAX(datetime) as datetime, -- Gets datetime of the latest interest entry
    json_extract(data, '$.interest') AS interest
FROM 
    account_history
WHERE 
    json_extract(data, '$.interest') IS NOT NULL
GROUP BY 
    accountid
`;

// --- Helper Functions --- 

/**
 * Prepares fields from request body based on allowed keys.
 * @param {object} requestBody - The request body.
 * @returns {Array<{key: string, value: any}>} - Array of key-value pairs to insert/update.
 */
function prepareFields(requestBody) {
    let values = [];
    accountKeys.forEach((key) => {
        const value = requestBody[key];
        // Include the key if it exists in the request body, even if value is null/empty
        if (value !== undefined) { 
            values.push({ key, value: value === "" ? null : value }); // Standardize empty string to null
        }
    });
    return values;
}

/**
 * Recursively searches an array of account objects (and their children) for a specific ID.
 * @param {Array<object>} accounts - The array of account objects to search.
 * @param {string} id - The account ID to find.
 * @returns {object|null} The found account object or null.
 */
function findAccountById(accounts, id) {
  for (const account of accounts) {
    if (account.accountid === id) {
      return account; // Found at this level
    }
    // Recursively search in children if they exist
    if (account.children && account.children.length > 0) {
      const foundInChildren = findAccountById(account.children, id);
      if (foundInChildren) {
        return foundInChildren; // Found in subtree
      }
    }
  }
  return null; // Not found in this array or its children
}

// --- Internal Helpers for getAllAggregatedSorted --- 

/**
 * Fetches raw account data and interest data from the database.
 * @returns {Promise<{rawAccounts: Array<object>, rawInterest: Array<object>}>}
 */
async function _fetchRawAccountsAndInterest() {
    logger.debug("AccountService: Fetching raw accounts and interest.");
    const rawAccounts = dbInstance.db.prepare(baseAccountQuery).all();
    const rawInterest = dbInstance.db.prepare(interestSql).all();
    logger.debug(`AccountService: Fetched ${rawAccounts?.length || 0} raw accounts and ${rawInterest?.length || 0} interest records.`);
    return { rawAccounts, rawInterest };
}

/**
 * Builds a map of account objects keyed by their accountid.
 * @param {Array<object>} rawAccounts - The raw account data array.
 * @returns {Map<string, object>} - A Map where keys are account IDs and values are account objects.
 */
function _buildAccountMap(rawAccounts) {
    const accountMap = new Map();
    if (rawAccounts) {
        rawAccounts.forEach(acc => accountMap.set(acc.accountid, { ...acc, children: [], hasChildren: false })); // Initialize children/hasChildren
    }
    logger.debug(`AccountService: Built account map with ${accountMap.size} entries.`);
    return accountMap;
}

/**
 * Aggregates child account balances and latest dates into their parent accounts.
 * Modifies the accountMap directly.
 * @param {Map<string, object>} accountMap - The map of account objects.
 */
function _aggregateBalances(accountMap) {
    logger.debug("AccountService: Starting balance aggregation.");
    const childBalanceSums = {};
    const childLatestDates = {};
    const parents = new Set();

    // First pass: Identify parents and calculate sums/latest dates from children
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

    // Second pass: Apply aggregated values to parent accounts
    parents.forEach(parentId => {
        const parentAccount = accountMap.get(parentId);
        if (parentAccount) { 
            parentAccount.balance = childBalanceSums[parentId] || 0;
            const latestChildDate = childLatestDates[parentId];
            if (latestChildDate && (!parentAccount.balance_datetime || new Date(latestChildDate) > new Date(parentAccount.balance_datetime))) {
                parentAccount.balance_datetime = latestChildDate;
            }
            parentAccount.hasChildren = true; // Mark as having children
        }
    });
    logger.debug(`AccountService: Aggregated balances for ${parents.size} parent accounts.`);
}

/**
 * Builds the hierarchical structure by assigning children to parents and sorts children.
 * Modifies the accountMap directly.
 * @param {Map<string, object>} accountMap - The map of account objects.
 * @returns {Array<object>} - An array containing only the top-level account objects.
 */
function _buildHierarchyAndSortChildren(accountMap) {
    logger.debug("AccountService: Building hierarchy and sorting children.");
    const hierarchicalAccounts = [];

    accountMap.forEach(account => {
        if (account.parentid && accountMap.has(account.parentid)) {
            const parent = accountMap.get(account.parentid);
            parent.children.push(account); // Add child to parent's children array
        } else if (!account.parentid) {
            hierarchicalAccounts.push(account); // Add top-level account to the final list
        }
    });

    // Sort children within each parent
    accountMap.forEach(account => {
        if (account.children.length > 1) { // Only sort if there's more than one child
            account.children.sort((a, b) => a.name.localeCompare(b.name));
        }
    });
    logger.debug(`AccountService: Hierarchy built. ${hierarchicalAccounts.length} top-level accounts identified.`);
    return hierarchicalAccounts;
}

/**
 * Merges interest data into the corresponding accounts in the accountMap.
 * Modifies the accountMap directly.
 * @param {Map<string, object>} accountMap - The map of account objects.
 * @param {Array<object>} rawInterest - The raw interest data array.
 */
function _mergeInterestData(accountMap, rawInterest) {
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

/**
 * Sorts the top-level accounts based on predefined type order and balance.
 * @param {Array<object>} topLevelAccounts - The array of top-level account objects.
 */
function _sortTopLevelAccounts(topLevelAccounts) {
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

// --- Service Functions (Refactored and Existing) --- 

/**
 * Fetches all accounts, performs aggregation and sorting.
 * @returns {Promise<Array<object>>} - The processed list of accounts.
 */
async function getAllAggregatedSorted() {
    // 1. Fetch raw data
    const { rawAccounts, rawInterest } = await _fetchRawAccountsAndInterest();

    if (!rawAccounts || rawAccounts.length === 0) {
        return []; // Return early if no accounts found
    }

    // 2. Build initial account map
    const accountMap = _buildAccountMap(rawAccounts);

    // 3. Aggregate balances (modifies accountMap)
    _aggregateBalances(accountMap);

    // 4. Build hierarchy and sort children (modifies accountMap, returns top-level list)
    const hierarchicalAccounts = _buildHierarchyAndSortChildren(accountMap);

    // 5. Merge interest data (modifies accountMap)
    _mergeInterestData(accountMap, rawInterest);

    // 6. Sort top-level accounts (modifies hierarchicalAccounts)
    _sortTopLevelAccounts(hierarchicalAccounts);

    logger.debug("AccountService: Returning final processed accounts.");
    return hierarchicalAccounts;
}

/**
 * Fetches a single account by ID, ensuring it has the same aggregated structure 
 * as accounts returned by getAllAggregatedSorted.
 * @param {string} accountId - The ID of the account to fetch.
 * @returns {Promise<object|null>} - The processed account object or null if not found.
 */
async function getOneAggregated(accountId) {
    logger.debug(`AccountService: Getting single aggregated account for ID: ${accountId}`);
    // Fetch the full, processed, hierarchical list
    const allAggregatedAccounts = await getAllAggregatedSorted();
    
    // Find the specific account within that structure
    const account = findAccountById(allAggregatedAccounts, accountId);
    
    if (!account) {
        logger.warn(`AccountService: Account ${accountId} not found in aggregated list.`);
        return null;
    }
    
    logger.debug(`AccountService: Found and returning aggregated account ${accountId}.`);
    return account;
}

/**
 * Fetches a single account by ID, merging latest interest data.
 * @param {string} accountId - The ID of the account to fetch.
 * @returns {Promise<object|null>} - The account object or null if not found.
 */
async function getOneWithInterest(accountId) {
    logger.debug(`AccountService: Fetching account with ID: ${accountId}`);
    const accountQuery = `${baseAccountQuery} WHERE a.accountid = ?`;
    // Use the service's dbInstance
    const account = dbInstance.db.prepare(accountQuery).get(accountId);

    if (!account) {
        return null;
    }

    // Fetch and merge interest data for this single account
    const singleInterestSql = `${interestSql} AND accountid = ?`;
    // Use the service's dbInstance
    const interest = dbInstance.db.prepare(singleInterestSql).get(accountId); 
    if (interest) {
        account.interest = interest.interest;
        account.interest_datetime = interest.datetime;
    }

    logger.debug(`AccountService: Returning account ${accountId} with interest data.`);
    return account;
}

/**
 * Creates a new account.
 * @param {object} accountData - The account data from the request body.
 * @returns {Promise<{success: boolean, message: string, accountid?: string}>}
 */
async function createAccount(accountData) {
    const { accountid } = accountData;
    if (!accountid) {
        // This check might be redundant if routes enforce it, but good practice
        return { success: false, message: "Account ID is required for creation." }; 
    }

    const fieldsToProcess = prepareFields(accountData);
    if (fieldsToProcess.length === 0) {
        return { success: false, message: "No valid fields provided to create the account." };
    }

    const fieldsToInsert = fieldsToProcess.map(f => f.key);
    const valuesToInsert = [accountid, ...fieldsToProcess.map(f => f.value)];
    const placeholders = new Array(fieldsToInsert.length).fill('?').join(', ');
    const columns = ['accountid', ...fieldsToInsert].join(", ");
    const insertQuery = `INSERT INTO account (${columns}) VALUES (?, ${placeholders})`;

    logger.debug(`AccountService: Creating account ${accountid}`);
    try {
        // Use the service's dbInstance
        const stmt = dbInstance.db.prepare(insertQuery);
        stmt.run(valuesToInsert);
        logger.info(`AccountService: Account ${accountid} created successfully.`);
        return { success: true, message: "Account created successfully", accountid };
    } catch (error) {
        logger.error(`AccountService: Error creating account ${accountid}: ${error.message}`, error);
        if (error.message.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Account ID already exists." };
        }
        // Re-throw unexpected errors to be caught by the route handler
        throw new Error("Database error during account creation."); 
    }
}

/**
 * Updates an existing account.
 * @param {string} accountId - The ID of the account to update.
 * @param {object} accountData - The account data from the request body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updateAccount(accountId, accountData) {
    const fieldsToProcess = prepareFields(accountData);
    if (fieldsToProcess.length === 0) {
        return { success: false, message: "No fields provided to update the account." };
    }

    const fieldsToUpdate = fieldsToProcess.map(f => f.key);
    const valuesToUpdate = [...fieldsToProcess.map(f => f.value), accountId];
    const updateFields = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const updateQuery = `UPDATE account SET ${updateFields} WHERE accountid = ?`;

    logger.debug(`AccountService: Updating account ${accountId}`);
    try {
        // Use the service's dbInstance
        const stmt = dbInstance.db.prepare(updateQuery);
        const result = stmt.run(valuesToUpdate);
        if (result.changes === 0) {
            logger.warn(`AccountService: Account ${accountId} not found for update.`);
            // Depending on desired behavior, you might return success: false or keep it success: true (idempotent)
            return { success: false, message: "Account not found or no changes applied." }; 
        }
        logger.info(`AccountService: Account ${accountId} updated successfully.`);
        return { success: true, message: "Account updated successfully" };
    } catch (error) {
        logger.error(`AccountService: Error updating account ${accountId}: ${error.message}`, error);
        // Re-throw unexpected errors
        throw new Error("Database error during account update."); 
    }
}

/**
 * Deletes an account.
 * @param {string} accountId - The ID of the account to delete.
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteAccount(accountId) {
    const deleteQuery = "DELETE FROM account WHERE accountid = ?";
    logger.debug(`AccountService: Deleting account ${accountId}`);
    try {
        // Use the service's dbInstance
        const stmt = dbInstance.db.prepare(deleteQuery);
        const result = stmt.run(accountId);

        if (result.changes === 0) {
            logger.warn(`AccountService: Account ${accountId} not found for deletion.`);
            return { success: false, message: "Account not found" };
        }
        logger.info(`AccountService: Account ${accountId} deleted successfully.`);
        return { success: true, message: "Account deleted successfully" };
    } catch (error) {
        logger.error(`AccountService: Error deleting account ${accountId}: ${error.message}`, error);
        // Re-throw unexpected errors
        throw new Error("Database error during account deletion."); 
    }
}

module.exports = {
    accountKeys, // Export keys if needed by routes (e.g., for validation setup)
    getAllAggregatedSorted,
    getOneAggregated,
    getOneWithInterest,
    createAccount,
    updateAccount,
    deleteAccount,
}; 