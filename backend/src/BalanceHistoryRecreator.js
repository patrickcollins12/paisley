const logger = require('./Logger');
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

        // Determine if we are looking for the absolute first or last point
        const isAbsoluteFirst = findNext && datetime === '0000-01-01T00:00:00Z';
        const isAbsoluteLast = !findNext && datetime === '9999-12-31T23:59:59Z';
        const needsDateComparison = !isAbsoluteFirst && !isAbsoluteLast;

        const dateCondition = needsDateComparison ? `AND datetime ${comparison} ?` : '';

        const query = `
            SELECT * FROM (
                SELECT 
                    datetime,
                    balance,
                    'account_history' as source,
                    data
                FROM account_history
                WHERE accountid = ? 
                ${dateCondition}
                AND (json_extract(data, '$.from') IS NULL OR json_extract(data, '$.from') != 'recreation')
                UNION ALL
                SELECT 
                    datetime,
                    balance,
                    'transaction' as source,
                    jsondata as data
                FROM "transaction"
                WHERE account = ?
                ${dateCondition}
                AND balance IS NOT NULL
            ) ORDER BY datetime ${ordering} LIMIT 1
        `;

        // Adjust parameters based on whether date comparison is needed
        const params = needsDateComparison 
            ? [this.accountid, datetime, this.accountid, datetime] 
            : [this.accountid, this.accountid];

        const result = this.db.db.prepare(query).get(...params);
        return result || null;
    }

    /**
     * Finds all non-recreation balance points for the account, ordered by date.
     * @returns {Promise<BalancePoint[]>}
     */
    async findAllAnchorPoints() {
        // Similar to findNearestBalancePoint but without date constraints or LIMIT
        const query = `
            SELECT * FROM (
                SELECT 
                    datetime,
                    balance,
                    'account_history' as source,
                    data
                FROM account_history
                WHERE accountid = ? 
                AND (json_extract(data, '$.from') IS NULL OR json_extract(data, '$.from') != 'recreation')
                UNION ALL
                SELECT 
                    datetime,
                    balance,
                    'transaction' as source,
                    jsondata as data
                FROM "transaction"
                WHERE account = ?
                AND balance IS NOT NULL
            ) ORDER BY datetime ASC
        `;
        const results = this.db.db.prepare(query).all(this.accountid, this.accountid);
        return results;
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
     * Deletes old recreation entries for this account
     * @param {string} startDate - Start date of the range to delete
     * @param {string} endDate - End date of the range to delete
     * @returns {Promise<void>}
     */
    async deleteOldRecreationEntries(startDate, endDate) {
        const query = `
            DELETE FROM account_history 
            WHERE accountid = ? 
            AND datetime >= ? 
            AND datetime <= ?
            AND json_extract(data, '$.from') = 'recreation'
        `;
        this.db.db.prepare(query).run(this.accountid, startDate, endDate);
    }

    /**
     * Records a balance point in the history table
     * @param {string} datetime - ISO datetime string
     * @param {number} balance - Balance amount
     * @param {object} metadata - Metadata object (from createMetadata)
     * @returns {Promise<{historyid: number, message: string}>} Result of the insert
     */
    async recordBalance(datetime, balance, metadata) {
        const query = `
            INSERT INTO account_history (accountid, datetime, balance, data)
            VALUES (?, ?, ?, ?)
        `;
        try {
            const result = this.db.db.prepare(query).run(this.accountid, datetime, balance, JSON.stringify(metadata));
            // better-sqlite3 run returns { changes: number, lastInsertRowid: number | bigint }
            logger.debug(`Recorded balance for ${this.accountid} at ${datetime}: ${balance} (ID: ${result.lastInsertRowid})`);
            return { historyid: result.lastInsertRowid, message: 'Balance recorded successfully' };
        } catch (error) {
            logger.error(`Failed to record balance for ${this.accountid} at ${datetime}: ${error}`);
            throw error; // Re-throw or handle as appropriate
        }
    }

    /**
     * Private helper to recalculate history between two anchor points.
     * @param {BalancePoint} startPoint - The starting anchor point.
     * @param {BalancePoint} endPoint - The ending anchor point.
     * @param {Function} recordBalance - Function to persist calculated points.
     * @param {boolean} isForward - Direction of calculation (true for forward, false for backward).
     * @returns {Promise<void>}
     * @private
     */
    async _recalculateSegment(startPoint, endPoint, recordBalance, isForward) {
        const startDate = isForward ? startPoint.datetime : endPoint.datetime;
        const endDate = isForward ? endPoint.datetime : startPoint.datetime;
        const startBalance = isForward ? startPoint.balance : endPoint.balance;

        // Get transactions strictly *between* the anchor points
        // Adjust query to exclude transactions exactly at start/end times if needed?
        // Currently includes transactions >= startDate and <= endDate.
        const transactions = await this.getTransactions(startDate, endDate);

        // Sort based on direction
        if (isForward) {
            transactions.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)); // Ascending for forward
        } else {
            transactions.sort((a, b) => new Date(b.datetime) - new Date(a.datetime)); // Descending for backward
        }

        logger.debug(`Recalculating segment for ${this.accountid} from ${startDate} to ${endDate} (${isForward ? 'forward' : 'backward'}). Start balance: ${startBalance}. Found ${transactions.length} transactions.`);

        let runningBalance = startBalance;
        let lastProcessedPoint = startPoint; // For metadata in forward pass
        let pointAfterCurrent = endPoint;   // For metadata in backward pass

        for (const transaction of transactions) {
            // Skip transactions exactly matching the start/end points themselves? 
            // If startPoint/endPoint came from transactions table, this prevents reprocessing.
            // However, our anchors primarily come from account_history.
            if (transaction.datetime === startPoint.datetime || transaction.datetime === endPoint.datetime) {
                 logger.debug(`Skipping transaction at exact boundary time ${transaction.datetime}`);
                 continue;
            }

            let balanceToRecord;
            let metadata;

            if (isForward) {
                runningBalance = this.processTransaction(runningBalance, transaction);
                balanceToRecord = runningBalance;
                // Forward: prev=lastProcessedPoint, next=endPoint (ultimate target)
                metadata = this.createMetadata(lastProcessedPoint, endPoint, true, false, false);
                lastProcessedPoint = { datetime: transaction.datetime, balance: runningBalance, source: 'recreation' };
            } else {
                // Backward: Calculate balance *before* transaction
                runningBalance = runningBalance - (transaction.credit || 0) + (transaction.debit || 0);
                balanceToRecord = runningBalance;
                // Backward: prev=pointAfterCurrent, next=startPoint (ultimate target)
                metadata = this.createMetadata(pointAfterCurrent, startPoint, false, false, false);
                 pointAfterCurrent = { datetime: transaction.datetime, balance: runningBalance, source: 'recreation' };
            }
            
            await recordBalance(this.accountid, transaction.datetime, balanceToRecord, metadata);
            logger.debug(`Recorded ${isForward ? 'forward' : 'backward'} point for ${this.accountid} at ${transaction.datetime}: ${balanceToRecord}`);
        }
        
        // Final balance verification (optional, could be done by caller)
        const finalExpectedBalance = isForward ? endPoint.balance : startPoint.balance;
        if (Math.abs(runningBalance - finalExpectedBalance) > 0.001) {
             logger.warn(`Segment end balance mismatch for ${this.accountid} (${startDate} -> ${endDate}). Expected ${finalExpectedBalance}, calculated ${runningBalance}.`);
        }
    }

    /**
     * Recreates the full account history by recalculating segments between existing anchor points.
     * This uses an iterative forward calculation strategy.
     * @param {Function} recordBalance - Function to record a balance (async (accountid, datetime, balance, metadata) => Promise<void>)
     * @returns {Promise<void>}
     */
    async recreateFullAccountHistory(recordBalance) {
        // 1. Find all existing anchor points
        const anchorPoints = await this.findAllAnchorPoints();

        if (anchorPoints.length < 2) {
            logger.warn(`Account ${this.accountid} has fewer than 2 anchor points (${anchorPoints.length}). Cannot perform full recreation.`);
            // Optionally delete any existing recreation entries if desired even in this case?
            if (anchorPoints.length > 0) {
                await this.deleteOldRecreationEntries(anchorPoints[0].datetime, anchorPoints[0].datetime); // Delete any potential single point recreation
            }
            return;
        }

        const firstAnchor = anchorPoints[0];
        const lastAnchor = anchorPoints[anchorPoints.length - 1];

        // 2. Delete *all* old recreation entries between the first and last anchor
        logger.info(`Deleting all old recreation entries for ${this.accountid} between ${firstAnchor.datetime} and ${lastAnchor.datetime}`);
        await this.deleteOldRecreationEntries(firstAnchor.datetime, lastAnchor.datetime);

        // 3. Iterate through adjacent anchor points and recalculate forward
        logger.info(`Recreating history for ${this.accountid} using ${anchorPoints.length} anchors, calculating forward.`);
        for (let i = 0; i < anchorPoints.length - 1; i++) {
            const startPoint = anchorPoints[i];
            const endPoint = anchorPoints[i + 1];
            logger.debug(`Processing segment ${i + 1}/${anchorPoints.length - 1}: ${startPoint.datetime} -> ${endPoint.datetime}`);
            await this._recalculateSegment(startPoint, endPoint, recordBalance, true); // isForward = true
        }

        logger.info(`Full account history recreation completed for ${this.accountid}.`);
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
        const prevBalancePoint = await recreator.findNearestBalancePoint(datetime, false);
        const nextBalancePoint = await recreator.findNearestBalancePoint(datetime, true);

        // Define the manual point as a BalancePoint object for the helper
        const manualPoint = { datetime, balance, source: 'manual' }; // Assuming 'manual' or similar source

        // Determine the overall start and end date for deletion
        const startDate = prevBalancePoint ? prevBalancePoint.datetime : datetime;
        const endDate = nextBalancePoint ? nextBalancePoint.datetime : datetime;
        logger.info(`Deleting old recreation entries for ${accountid} between ${startDate} and ${endDate} for manual update at ${datetime}`);
        await recreator.deleteOldRecreationEntries(startDate, endDate);

        // Recalculate forward from previous anchor to manual point
        if (prevBalancePoint) {
            logger.debug(`Recalculating forward segment from previous anchor ${prevBalancePoint.datetime} to manual point ${manualPoint.datetime}`);
            await recreator._recalculateSegment(prevBalancePoint, manualPoint, recordBalance, true);
        }

        // Recalculate forward from manual point to next anchor
        if (nextBalancePoint) {
            logger.debug(`Recalculating forward segment from manual point ${manualPoint.datetime} to next anchor ${nextBalancePoint.datetime}`);
            await recreator._recalculateSegment(manualPoint, nextBalancePoint, recordBalance, true);
        }

        // Record the manual balance point itself
        logger.debug(`Recording manual balance point for ${accountid} at ${datetime}: ${balance}`);
        const metadata = recreator.createMetadata(prevBalancePoint, nextBalancePoint, false, true, true); // Mark as manual and final for this operation context
        await recordBalance(accountid, datetime, balance, metadata);
    }
}

module.exports = BalanceHistoryRecreator; 