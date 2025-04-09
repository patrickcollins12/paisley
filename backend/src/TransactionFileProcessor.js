const config = require('./Config');
const CSVParserFactory = require('./CSVParserFactory');
const FileWatcher = require('./FileWatcher');
const FileMover = require('./FileMover');
const RulesClassifier = require('./RulesClassifier');
const logger = require('./Logger');
const BankDatabase = require('./BankDatabase'); // Import BankDatabase
class TransactionFileProcessor {
    constructor() {
        this.parsers = {};
        this.parseResultsBatch = [];
        this.classifier = new RulesClassifier();
    }

    async start() {
        const csvParserFactory = await this.initializeCsvParserFactory();

        if (!config.csv_watch) {
            throw new Error('csv_watch configuration is required');
        }
        if (!config.csv_processed) {
            throw new Error('csv_processed configuration is required');
        }

        const watchDir = config.csv_watch;
        const processedDir = config.csv_processed;

        const processFile = async (file) => {
            try {
                const csvParser = await csvParserFactory.chooseParser(file);
                let parseResults = await csvParser.parse(file);

                if (parseResults.isSuccess()) {
                    await FileMover.moveFile(watchDir, file, processedDir);
                }
                this.parseResultsBatch.push(parseResults);
            } catch (error) {
                logger.error(`Error processing file: ${error}`);
            }
        };

        const fileWatcher = new FileWatcher(processFile, this.finishedBatchOfFiles.bind(this));

        fileWatcher.startWatching(watchDir, processedDir);
        logger.info("Watching for CSV files");

        return this;
    }

    async initializeCsvParserFactory() {
        const csvParserFactory = new CSVParserFactory();
        await csvParserFactory.loadParsers();
        return csvParserFactory;
    }

    // After some seconds have elapsed, after parsing a batch of files
    // then at that point we want to call the classifier.
    async finishedBatchOfFiles() {
        let insertedIds = this.parseResultsBatch.map(result => result.inserted_ids).flat();
        for (const pr of this.parseResultsBatch) {
            await pr.print()
        }

        // CLASSIFY THE RECENTLY ADDED TRANSACTIONS
        logger.info("Starting classification");
        this.classifier.applyAllRules(insertedIds);
        logger.info(`Finished processing batch of ${insertedIds.length}`);
        // logger.info(`Batch details:\n${JSON.stringify(this.parseResultsBatch, null, "\t")}`);

        // Trigger Recalculation for Reference Accounts ---
        try {
            const db = new BankDatabase(); // Get DB instance
            const referenceAccountsStmt = db.db.prepare(`SELECT DISTINCT accountid FROM account_history WHERE is_reference = TRUE`);
            const referenceAccounts = referenceAccountsStmt.all();

            if (referenceAccounts.length > 0) {
                logger.info(`Found ${referenceAccounts.length} accounts with reference balances. Triggering recalculation...`);
                for (const row of referenceAccounts) {
                    const accountid = row.accountid;
                    try {
                        // Trigger recalculation asynchronously (don't wait for each one)
                        db.recalculateAccountBalances(accountid)
                            .then(() => {
                                logger.info(`Recalculation successfully triggered for reference account ${accountid} after batch import.`);
                            })
                            .catch(recalcErr => {
                                logger.error(`Recalculation failed for reference account ${accountid} after batch import: ${recalcErr.message}`, recalcErr);
                            });
                    } catch (triggerErr) {
                        logger.error(`Failed to trigger recalculation for reference account ${accountid}: ${triggerErr.message}`, triggerErr);
                    }
                }
            } else {
                logger.info("No accounts with reference balances found. Skipping batch recalculation trigger.");
            }
        } catch (dbError) {
            logger.error(`Error accessing database for batch recalculation trigger: ${dbError.message}`, dbError);
        }


        this.parseResultsBatch = [];
    }
}

module.exports = TransactionFileProcessor;
