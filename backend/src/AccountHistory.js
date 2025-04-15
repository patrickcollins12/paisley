const logger = require('./Logger');
// import logger from './Logger';
// import BankDatabase from './BankDatabase';
// import TimeSeriesTransformer from './TimeSeriesTransformer';
const BankDatabase = require('./BankDatabase');
const TimeSeriesTransformer = require('./TimeSeriesTransformer');

/**
 * @typedef {Object} BalancePoint
 * @property {string} datetime - ISO datetime string
 * @property {number} balance - The balance amount
 * @property {string} source - Where this balance came from ('account_history' or 'transaction')
 */

/**
 * @typedef {Object} Transaction
 * @property {string} datetime - ISO datetime string
 * @property {number} credit - Credit amount, if any
 * @property {number} debit - Debit amount, if any
 */

class BalanceRecreator {
    constructor(accountid, manualBalanceDate, manualBalance) {
        this.accountid = accountid;
        this.manualBalanceDate = manualBalanceDate;
        this.manualBalance = manualBalance;
        this.db = new BankDatabase();
    }

    /**
     * Finds the nearest balance point before or after a given date
     * @param {string} datetime - Reference datetime
     * @param {boolean} findNext - If true, finds next balance, if false finds previous
     * @returns {Promise<BalancePoint|null>}
     */
    async findNearestBalancePoint(datetime, findNext = false) {
        const comparison = findNext ? '>' : '<';
        const ordering = findNext ? 'ASC' : 'DESC';

        const query = `
            SELECT * FROM (
                SELECT 
                    datetime,
                    balance,
                    'account_history' as source,
                    data
                FROM account_history
                WHERE accountid = ? 
                AND datetime ${comparison} ?
                AND (json_extract(data, '$.from') IS NULL OR json_extract(data, '$.from') != 'recreation')
                UNION ALL
                SELECT 
                    datetime,
                    balance,
                    'transaction' as source,
                    NULL as data
                FROM "transaction"
                WHERE account = ? 
                    AND datetime ${comparison} ?
                    AND balance IS NOT NULL
            ) 
            ORDER BY datetime ${ordering}
            LIMIT 1
        `;

        return this.db.db.prepare(query)
            .get(this.accountid, datetime, this.accountid, datetime);
    }

    /**
     * Fetches transactions between two dates
     * @param {string} startDate - Start datetime
     * @param {string|null} endDate - End datetime (optional)
     * @returns {Promise<Transaction[]>}
     */
    async getTransactions(startDate, endDate = null) {
        const query = `
            SELECT 
                datetime,
                credit,
                debit
            FROM "transaction"
            WHERE account = ?
                AND datetime > ?
                ${endDate ? 'AND datetime <= ?' : ''}
            ORDER BY datetime ASC
        `;

        const params = [this.accountid, startDate];
        if (endDate) params.push(endDate);

        return this.db.db.prepare(query).all(...params);
    }

    /**
     * Creates metadata for a balance point
     * @param {BalancePoint} prevBalance - Previous balance point
     * @param {BalancePoint|null} nextBalance - Next balance point (if any)
     * @param {boolean} isForward - Whether we're processing forward from manual balance
     * @param {boolean} isManualBalance - Whether this is a manual balance point
     * @param {boolean} isFinalBalance - Whether this is the final balance point
     * @returns {Object}
     */
    createMetadata(prevBalance, nextBalance, isForward = false, isManualBalance = false, isFinalBalance = false) {
        const metadata = {
            from: "recreation",
            recreation_timestamp: new Date().toISOString(),
            source_balance_from: {
                datetime: prevBalance.datetime,
                balance: prevBalance.balance,
                source: prevBalance.source
            }
        };

        if (nextBalance) {
            metadata.source_balance_next = {
                datetime: nextBalance.datetime,
                balance: nextBalance.balance,
                source: nextBalance.source
            };
        }

        if (isForward) metadata.direction = "forward";
        if (isManualBalance) metadata.manual_balance = true;
        if (isFinalBalance) metadata.final_forward_balance = true;

        return metadata;
    }

    /**
     * Updates running balance based on a transaction
     * @param {number} runningBalance - Current running balance
     * @param {Transaction} transaction - Transaction to process
     * @returns {number} - New running balance
     */
    processTransaction(runningBalance, transaction) {
        if (transaction.credit) runningBalance += transaction.credit;
        if (transaction.debit) runningBalance -= transaction.debit;
        return runningBalance;
    }
}

class AccountHistory {

    static async recordBalance(accountid, datetime, balance, data = {}) {
        const db = new BankDatabase();
        const query = `INSERT INTO account_history (accountid, datetime, balance, data) VALUES (?, ?, ?, ?)`;

        try {
            const stmt = db.db.prepare(query);
            const result = stmt.run(accountid, datetime, balance, JSON.stringify(data));
            return { historyid: result.lastInsertRowid, message: "Balance recorded" };
        } catch (err) {
            logger.error(`Error inserting balance: ${err.message}`);
            if (err.message.includes("FOREIGN KEY constraint failed")) {
                throw new Error(`Account ID '${accountid}' does not exist.`);
            }
            throw err;
        }
    }

    static async getAccountHistory(accountid, from, to, interpolate = false) {
        const db = new BankDatabase();
        // Simplified query using UNION ALL and relying on outer DISTINCT if needed (or removing it)
        // Also ensure filtering happens *after* the UNION ALL
        let query = `
            SELECT DISTINCT * FROM (
                SELECT 
                    h.accountid, 
                    h.datetime, 
                    h.balance,
                    h.data,
                    a.parentid as parentid,
                    'account_history' as source
                FROM 
                    account_history h
                    LEFT JOIN account a on h.accountid = a.accountid
                WHERE h.balance IS NOT NULL -- Ensure history balance exists

                UNION ALL -- Use UNION ALL instead of UNION

                SELECT 
                    t.account AS accountid, -- Alias consistently
                    t.datetime,
                    t.balance,
                    NULL AS data, -- Revert to selecting NULL for transaction data column
                    a.parentid as parentid,
                    'transaction' as source
                FROM 'transaction' t
                    LEFT JOIN account a on t.account = a.accountid
                WHERE t.balance IS NOT NULL -- Ensure transaction balance exists
                  AND t.rowid = (
                    SELECT MAX(t2.rowid)
                    FROM 'transaction' t2
                    WHERE t2.account = t.account
                        AND t2.datetime = t.datetime
                )
            ) AS combined_sources
            WHERE 1=1
        `;
        const params = [];

        if (accountid) {
            // Filter within the WHERE clause after UNION ALL
            query += ` AND (accountid = ? OR parentid = ?)`;
            params.push(accountid, accountid);
        }
        if (from) {
            query += ` AND datetime >= ?`;
            params.push(from);
        }
        if (to) {
            query += ` AND datetime <= ?`;
            params.push(to);
        }
        query += ` ORDER BY accountid ASC, datetime ASC`;

        try {
            // logger.debug("Executing getAccountHistory query:", query, params);
            const stmt = db.db.prepare(query);
            let rows = stmt.all(...params);
            // logger.debug("Raw rows from DB:", rows);

            // if there is more than one accountid, we need to forcefully interpolate
            // because echarts must have the same datetime for all series
            let accountids = [...new Set(rows.map(row => row.accountid))];

            if (accountids.length > 1) {
                interpolate = true;
            }

            // if there is an accountid specified, and multiple accounts are returned, 
            // then there are child accounts. in this instance we actually must delete 
            // the parent accountid from the returned rows
            if (accountid && accountids.length > 1) {
                rows = rows.filter(row => row.accountid !== accountid);
            }

            return TimeSeriesTransformer.normalizeTimeSeries(rows, interpolate)

        } catch (err) {
            logger.error(`Error fetching account history: ${err.message}`);
            throw err;
        }
    }

    static async getTransactionVolume(accountid, from, to) {
        const db = new BankDatabase();
        let query = `
            SELECT 
                t.account, 
                DATE(t.datetime) AS date, 
                COUNT(*) AS transaction_count 
            FROM 'transaction' t 
            WHERE 1=1
        `;
        const params = [];

        if (accountid) {
            query += " AND t.account = ?";
            params.push(accountid);
        }
        if (from) {
            query += " AND t.datetime >= ?";
            params.push(from);
        }
        if (to) {
            query += " AND t.datetime <= ?";
            params.push(to);
        }

        query += " GROUP BY t.account, DATE(t.datetime) ORDER BY date DESC";

        try {
            const stmt = db.db.prepare(query);
            return stmt.all(...params);
        } catch (err) {
            logger.error(`Error fetching account transaction volume: ${err.message}`);
            throw err;
        }
    }

    static async getInterestChanges(accountid, from, to) {
        const db = new BankDatabase();
        let query = `
            WITH InterestChanges AS (
                SELECT historyid,
                    accountid,
                    datetime,
                    json_extract(data, '$.interest') AS interest,
                    LAG(json_extract(data, '$.interest')) OVER (
                        PARTITION BY accountid
                        ORDER BY datetime
                    ) AS previous_interest
                FROM account_history
                WHERE json_extract(data, '$.interest') IS NOT NULL
            ),
            NewestInterest AS (
                SELECT historyid,
                    accountid,
                    datetime,
                    json_extract(data, '$.interest') AS interest,
                    ''
                FROM account_history AS a
                WHERE json_extract(data, '$.interest') IS NOT NULL
                    AND datetime = (
                        SELECT MAX(datetime)
                        FROM account_history AS b
                        WHERE a.accountid = b.accountid
                    )
            )
            SELECT historyid,
                accountid,
                datetime,
                interest
            FROM (
                SELECT *
                FROM InterestChanges
                WHERE interest != previous_interest
                    OR previous_interest IS NULL
                UNION ALL
                SELECT *
                FROM NewestInterest
            )
            WHERE 1 = 1
        `;
        const params = [];

        if (accountid) {
            query += " AND accountid = ?";
            params.push(accountid);
        }
        if (from) {
            query += " AND datetime >= ?";
            params.push(from);
        }
        if (to) {
            query += " AND datetime <= ?";
            params.push(to);
        }

        query += " ORDER BY datetime DESC";

        try {
            const stmt = db.db.prepare(query);
            return stmt.all(...params);
        } catch (err) {
            logger.error(`Error fetching interest changes: ${err.message}`);
            throw err;
        }
    }
}

module.exports = AccountHistory;