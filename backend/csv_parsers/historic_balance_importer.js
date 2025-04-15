const BaseCSVParser = require('../src/BaseCSVParser');
const { DateTime } = require("luxon");
const logger = require('../src/Logger'); // Assuming logger is available
const util = require('../src/ScraperUtil');
const AccountHistory = require("../src/AccountHistory");
const { createAccount } = require('../src/AccountService');

class GenericBalanceCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options); // Pass options (which should include util) to the base class
        this.identifier = 'chase';
        this.timezone = 'Australia/Sydney'; // Defined timezone
        this.dateFormat = 'LLL d yyyy'; // Luxon format for "Jan 8 2020"

        // Columns from the CSV defining a unique transaction
        this.uniqueColumns = ['datetime', 'accountid'];

        this.accountsCreated = new Set();
        // Fields required in the final processed object before saving
        this.mustExistBeforeSaving = ['datetime', 'accountid', 'account_shortname', 'amount', 'currency'];
    }

    matchesFileName(fileName) {
        return fileName.toLowerCase().includes('historic_balances');
    }

    async processLine(l) {

        // 1. Parse Date
        let parsedDate;
        try {
            parsedDate = DateTime.fromFormat(l.date, this.dateFormat, { zone: this.timezone });
            if (!parsedDate.isValid) {
                throw new Error(`Invalid date format: ${l.date}`);
            }
            // Set time to start of day explicitly, though zone handling should manage offsets
            parsedDate = parsedDate.startOf('day');
        } catch (error) {
            logger.error(`Error parsing date "${l.date}": ${error.message}`);
            throw error; // Re-throw to halt processing for this line if date is critical
        }
        const isoDateTime = parsedDate.toISO();

        // 2. Parse Amount (remove commas)
        const parsedAmount = parseFloat(String(l.amount).replace(/,/g, ''));
        if (isNaN(parsedAmount)) {
            logger.warn(`Could not parse amount: "${l.amount}" for account ${l.accountid} on ${l.date}. Setting to 0.`);
            // Decide handling: throw error, return null, or set to 0? Setting to 0 for now.
            // throw new Error(`Invalid amount format: ${l.amount}`);
        }

        // 3. Prepare Account Data
        const accountId = String(l.accountid).trim();
        const accountName = String(l.account).trim();
        const accountCurrency = String(l.currency).trim();

        if (!accountId) {
            throw new Error(`Missing accountid for line with date ${l.date}`);
        }

        // 4. Attempt to Create Account (Gracefully handle if exists)
        if (!this.accountsCreated.has(accountId)) {
            // Add the account ID to the set immediately to prevent repeated attempts
            this.accountsCreated.add(accountId);

            const accountPayload = {
                accountid: accountId,
                shortname: accountName,
                currency: accountCurrency,
                // institution: 'Chase', // Assign institution
                // category: 'Unknown', // Optionally assign a default category
                // status: 'active' // Optionally set default status
            };

            try {
                const result = await createAccount(req.body);
                logger.debug(`Successfully created account ${accountId}`);
            } catch (createError) {
                logger.debug(`Account ${accountId} likely already exists (received 400 status). Proceeding.`);
            }
        }


        const result = await AccountHistory.recordBalance(accountId, isoDateTime, parsedAmount, { "source": "historic_balance_importer" });


        // return nothing as a transaction
        return;
    }
}

module.exports = GenericBalanceCSVParser;