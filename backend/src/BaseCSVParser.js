const CSVParser = require('csv-parser');
const fs = require('fs');
const { DateTime } = require("luxon");

const readline = require('readline');
const path = require('path');
const ParseResults = require('./ParseResults.js');
const config = require('./Config');
const BankDatabase = require('./BankDatabase');
const Util = require('./Util.js');
const logger = require('./Logger.js');

class BaseCSVParser {

    constructor(fileName) {
        // if (options) {
        this.fileName = fileName || "";
        // this.config = config;
        this.bankconfig = config[this.constructor.name];
        this.headers = []; // csv headers, override if needed.
        this.results = new ParseResults();
        this.db = new BankDatabase();
        
    }

    async parse(filePath) {

        const mustReverse = this.must_process_csv_in_reverse || false;
        let parsedRows = [];

        const csv = this.headers?.length > 0 ?
            CSVParser(this.headers) :
            CSVParser();

        try {

            // Fully parse CSV first, letting csv-parser do its job,

            const stream = fs.createReadStream(filePath).pipe(csv);

            // yeah it's memory hungry to load the whole file into memory, but
            // i might need to do this to reverse the order of the rows
            for await (const originalLine of stream) {
                parsedRows.push(originalLine); // Collect parsed rows
            }

            // Reverse the order of rows if needed
            if (mustReverse) {
                parsedRows.reverse();
            }

            // Process parsed rows in order
            for (const row of parsedRows) {
                this.originalLine = row;
                this.results.lines++;
                await this.processLineAsync();
            }

        } catch (error) {
            logger.error(`Error processing file: ${error}`);
        }

        this.results.file = path.basename(this.fileName);
        this.results.account = this.accountid;
        this.results.parser = this.constructor.name;

        return this.results;
    }


    async processLineAsync() {
        try {
            this.processedLine = this.processLine(this.originalLine);

            if (!this.processedLine?.datetime) {
                this.results.skipped++;
                // logger.info(`here1 ${this.originalLine} ${this.processedLine}`)
                return;
            }

            this.results.setMinMaxDate("in_file", this.processedLine['datetime']);

            if (this.oldUniqueColumns) {
                await this.renameTransactionIDs();
            }

            if (this.isAlreadyInserted()) {
                this.results.skipped++;
                // logger.info(`skipping because already inserted: ${JSON.stringify(this.processedLine)}`);

                this.results.setMinMaxDate("skipped", this.processedLine['datetime']);

                // Call transactionSkipped if it has been defined in the subclass
                if (typeof this.transactionSkipped === 'function') {
                    this.transactionSkipped();
                }

            } else {
                await this.handleValidRecord();
            }
        } catch (error) {
            logger.error(`Error processing line: ${error}`);
            this.results.invalid++;
        }
    }

    async handleValidRecord() {
        try {
            this.isRecordValid();
            const newId = this.saveTransaction();
            this.results.insert(newId);
            this.results.setMinMaxDate("inserts", this.processedLine['datetime']);

            // Log successful insertion with colored text
            const tx = this.processedLine;
            const amount = tx.debit ? `-$${tx.debit}` : `+$${tx.credit}`;
            const date = tx.datetime.split('T')[0];
            const chalk = await Util.loadChalk();
            const insertedText = chalk.green('INSERTED');
            logger.info(`${insertedText} ${date} ${tx.description || ''} ${amount} Bal:$${tx.balance || ''}`);

            // Call hasSaved if it has been defined in the subclass
            if (typeof this.transactionSaved === 'function') {
                this.transactionSaved(newId);
            }

        } catch (error) {
            logger.error(`Invalid record encountered: ${error}`);
            this.results.invalid++;
        }
    }

    // CREATE TABLE "transaction" (
    //     "id"	TEXT NOT NULL UNIQUE,
    //     "datetime"	TEXT, 
    //     "account"	TEXT,
    //     "description"	TEXT,
    //     "credit" INTEGER,
    //     "debit" INTEGER,
    //     "balance"	INTEGER,
    //     "type"	INTEGER,
    //     "tags" JSON,
    //     jsondata JSON, "notes" TEXT, 'party' JSON, 'inserted_datetime' TEXT, 
    //     PRIMARY KEY("id")
    // )
    saveTransaction() {
        this.prepareForSave()

        // WARNING: You can't arbitrarily add data to the transaction table from the parsers
        //          without updating this list first.
        //          This allows us to put data in the processedLine record as a working storage solution,
        //          but only the final knownColumns get saved and the rest can be ignored.
        let knownColumns = [
            "id",
            "datetime",
            "account",
            "description",
            "credit",
            "debit",
            "balance",
            "type",
            "jsondata",
            "notes",
            // "tags",   // not sure if parsers should be able to directly add tags. 
            // "party",  //   If they do, we probably need special processing logic here
            "inserted_datetime"
        ]

        // Filter the columns to include only those that are in knownColumns and have a value in processedLine
        const validColumns = Object.keys(this.processedLine).filter(key => knownColumns.includes(key) && this.processedLine[key]);


        // Create the SQL parts
        const columns = validColumns.map(key => `"${key}"`).join(', ');
        const placeholders = validColumns.map(() => '?').join(', ');
        const values = validColumns.map(key => this.processedLine[key]);

        // Construct the SQL query
        const sql = `INSERT INTO 'transaction' (${columns}) VALUES (${placeholders})`;

        // Prepare and run the query with the data values
        const stmt = this.db.db.prepare(sql);
        let result = stmt.run(Object.values(values));

        this.saveTransactionEnriched()

        return this.processedLine['id'];
    }

    // checks for presence of advanced fields and saves them to transaction_enriched
    saveTransactionEnriched() {

        if (!this.processedLine?.id) {
            throw new Error("Food fight!")
        }

        // Helper to validate and stringify arrays
        const validateAndStringifyArray = (value) => Array.isArray(value) && value.length > 0 ? JSON.stringify(value) : undefined;

        const dataToUpdate = {
            description: this.processedLine.revised_description ?? undefined,
            tags: validateAndStringifyArray(this.processedLine.tags),
            party: validateAndStringifyArray(this.processedLine.party)
        };

        // Only proceed if there are fields to update other than 'id'
        if (Object.values(dataToUpdate).some(value => value != null && value !== '')) {
            dataToUpdate.id = this.processedLine.id

            const sql = `
                    INSERT INTO transaction_enriched (id, tags, description, party)
                    VALUES (@id, @tags, @description, @party)
                    ON CONFLICT(id) DO UPDATE SET
                    tags = COALESCE(@tags, tags),
                    description = COALESCE(@description, description),
                    party = COALESCE(@party, party)
                `;

            const stmt = this.db.db.prepare(sql);
            stmt.run(dataToUpdate);

        }
    }

    prepareForSave() {
        this.originalLine['file'] = path.basename(this.fileName);

        // add metadata to transaction
        this.processedLine['jsondata'] = JSON.stringify(this.originalLine);

        if (!this.processedLine['id']) {
            this.processedLine['id'] = Util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns)
        }

        this.processedLine['inserted_datetime'] = DateTime.now().toISO();
    }


    isAlreadyInserted() {

        let sha = Util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns)
        const stmt = this.db.db.prepare("select id from 'transaction' where id=?");
        const r = stmt.all(sha); // get() for a single row, all() for multiple rows
        if (r.length > 1) throw new Error('Error: Multiple records found.');
        const exists = r.length === 1
        // if (exists) {
        //     logger.info(`Exists\n-------\nOriginal: ${JSON.stringify(this.originalLine,null,"\t")}\nProcessed: ${JSON.stringify(this.processedLine,null,"\t")}\n${sha}`)
        // }

        return exists;
    }

    isRecordValid() {
        const line = this.processedLine
        // this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

        if (this.mustExistBeforeSaving) {
            for (const column of this.mustExistBeforeSaving) {
                if (column == "debit or credit") {
                    if (line['debit'] == null && line['credit'] == null) {
                        throw new Error(`${column} must be set on row ${this.results.lines}`)
                    }
                }
                else if (line[column] == null) {
                    throw new Error(`${column} must be set on row ${this.results.lines}`)
                }
            }
        }
        return true;
    }

    async renameTransactionIDs() {
        const oldId = Util.generateSHAFromObject(this.originalLine, this.processedLine, this.oldUniqueColumns);
        const newId = Util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns);

        const updateTransaction = this.db.db.prepare("UPDATE 'transaction' SET id = ? WHERE id = ?");
        const updateEnriched = this.db.db.prepare("UPDATE 'transaction_enriched' SET id = ? WHERE id = ?");

        try {
            const transactionResult = updateTransaction.run(newId, oldId);
            if (transactionResult.changes > 0) {
                logger.info(`Updated transaction record: ${oldId} to ${newId}`);
            }
        } catch (error) {
            logger.error(`Error updating transaction table: ${error.message}`);
        }

        try {
            const enrichedResult = updateEnriched.run(newId, oldId);
            if (enrichedResult.changes > 0) {
                logger.info(`Updated transaction_enriched record: ${oldId} to ${newId}`);
            }
        } catch (error) {
            logger.error(`Error updating transaction_enriched table: ${error.message}`);
        }
    }

    // MUST BE IMPLEMENTED IN SUBCLASS
    processLine(line) {
        throw new Error('processLine() must be implemented in subclass');
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        throw new Error('matchesFileName() must be implemented in subclass');
    }

    matchFileExpands(fileName) {
        let found = false;
        if (this.bankconfig && this.bankconfig.fileExpands) { } else { return false }
        try {
            for (const [pattern, accountid] of Object.entries(this.bankconfig.fileExpands)) {
                if (fileName.includes(pattern)) {
                    logger.info(`setting accountid: ${accountid}`)
                    this.accountid = accountid
                    found = true; break;
                }
            }
        }
        catch (error) {
            logger.error(`error: ${error}`)
        }
        return found;
    }

    async extractAccountBySecondLine() {

        return new Promise((resolve, reject) => {
            const rl = readline.createInterface({
                input: fs.createReadStream(this.fileName),
                crlfDelay: Infinity
            });

            let lineCount = 0;
            rl.on('line', (line) => {
                lineCount++;
                if (lineCount === 1) return; // Skip the first line

                if (lineCount === 2) {
                    try {
                        // var parserConfig = config[ Parser.name ]
                        for (const [pattern, accountid] of Object.entries(this.bankconfig.firstLinePatterns)) {
                            if (line.includes(pattern)) {
                                this.accountid = accountid
                                logger.info(`setting accountid: ${accountid}`)
                                resolve(true);
                                rl.close();
                                return
                            }
                        }
                    } catch { }


                    // reject(new Error("No parser matches the second line"));
                    resolve(null);
                    rl.close();
                }
            }).on('close', () => {
                if (lineCount < 2) {
                    // If the second line was not processed, it means the file has only one line
                    resolve(null);
                }
            }).on('error', reject);
        });
    }

    convertToLocalTime(datetime) {
        // Use the DateTime.fromFormat method to parse the input datetime according to the specified format and timezone
        return DateTime.fromFormat(datetime, this.dateFormat, { zone: this.timezone }).toISO();
    }

    extractDateFromFileName() {
        // Extract date from filename format: bank_$PID_Transactions_dd_mm_yyyy.csv
        // Can be overridden in subclasses for different patterns
        if (!this.fileName) {
            return null;
        }
        
        const match = this.fileName.match(/(\d{2})_(\d{2})_(\d{4})\.csv$/);
        if (match) {
            const [, day, month, year] = match;
            try {
                return DateTime.fromFormat(`${day}/${month}/${year}`, 'dd/MM/yyyy', { zone: this.timezone });
            } catch (error) {
                logger.warn(`Failed to parse date from filename: ${this.fileName}`);
                return null;
            }
        }
        
        return null; // No match found, let subclass handle if needed
    }

}

module.exports = BaseCSVParser;
