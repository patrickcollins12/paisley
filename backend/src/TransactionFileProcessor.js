const config = require('./Config');
const CSVParserFactory = require('./CSVParserFactory');
const FileWatcher = require('./FileWatcher');
const FileMover = require('./FileMover');
const RulesClassifier = require('./RulesClassifier');
const logger = require('./Logger');
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

        this.parseResultsBatch = [];
    }
}

module.exports = TransactionFileProcessor;
