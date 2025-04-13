const logger = require('./logger');
const BankDatabase = require('./BankDatabase');

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

class BalanceHistoryRecreator {
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
                    jsondata as data
                FROM "transaction"
                WHERE account = ?
                AND datetime ${comparison} ?
                AND balance IS NOT NULL
            ) ORDER BY datetime ${ordering} LIMIT 1
        `;

        const result = this.db.db.prepare(query).get(this.accountid, datetime, this.accountid, datetime);
        return result || null;
    }

    /**
     * Gets all transactions between two dates
     * @param {string} startDate - Start date
     * @param {string} endDate - End date (optional)
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
            AND datetime >= ?
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
     * @param {BalancePoint} nextBalance - Next balance point
     * @param {boolean} isForward - Whether we're moving forward in time
     * @param {boolean} isManualBalance - Whether this is a manual balance point
     * @param {boolean} isFinalBalance - Whether this is the final balance point
     * @returns {Object} Metadata object
     */
    createMetadata(prevBalance, nextBalance, isForward = false, isManualBalance = false, isFinalBalance = false) {
        return {
            from: 'recreation',
            prev_balance: prevBalance ? {
                datetime: prevBalance.datetime,
                balance: prevBalance.balance,
                source: prevBalance.source
            } : null,
            next_balance: nextBalance ? {
                datetime: nextBalance.datetime,
                balance: nextBalance.balance,
                source: nextBalance.source
            } : null,
            direction: isForward ? 'forward' : 'backward',
            is_manual_balance: isManualBalance,
            is_final_balance: isFinalBalance
        };
    }

    /**
     * Processes a transaction to update the running balance
     * @param {number} runningBalance - Current running balance
     * @param {Transaction} transaction - Transaction to process
     * @returns {number} Updated running balance
     */
    processTransaction(runningBalance, transaction) {
        return runningBalance + (transaction.credit || 0) - (transaction.debit || 0);
    }

    /**
     * Recreates the balance history for an account
     * @param {string} accountid - Account ID
     * @param {string} datetime - Reference datetime
     * @param {number} balance - Manual balance amount
     * @param {Function} recordBalance - Function to record a balance
     * @returns {Promise<void>}
     */
    static async recreateHistory(accountid, datetime, balance, recordBalance) {
        const recreator = new BalanceHistoryRecreator(accountid, datetime, balance);
        
        // Find the nearest balance points before and after our manual balance
        const prevBalance = await recreator.findNearestBalancePoint(datetime, false);
        const nextBalance = await recreator.findNearestBalancePoint(datetime, true);

        // If we have a previous balance, recreate from there to our manual balance
        if (prevBalance) {
            const transactions = await recreator.getTransactions(prevBalance.datetime, datetime);
            let runningBalance = prevBalance.balance;

            for (const transaction of transactions) {
                runningBalance = recreator.processTransaction(runningBalance, transaction);
                const metadata = recreator.createMetadata(prevBalance, { datetime, balance }, true);
                await recordBalance(accountid, transaction.datetime, runningBalance, metadata);
            }
        }

        // If we have a next balance, recreate from our manual balance to there
        if (nextBalance) {
            const transactions = await recreator.getTransactions(datetime, nextBalance.datetime);
            let runningBalance = balance;

            for (const transaction of transactions) {
                runningBalance = recreator.processTransaction(runningBalance, transaction);
                const metadata = recreator.createMetadata({ datetime, balance }, nextBalance, true);
                await recordBalance(accountid, transaction.datetime, runningBalance, metadata);
            }
        }

        // Record the manual balance point
        const metadata = recreator.createMetadata(prevBalance, nextBalance, false, true, true);
        await recordBalance(accountid, datetime, balance, metadata);
    }
}

module.exports = BalanceHistoryRecreator; 