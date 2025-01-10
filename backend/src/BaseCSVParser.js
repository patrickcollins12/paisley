const CSVParser = require('csv-parser');
const fs = require('fs');
const { DateTime } = require("luxon");

const readline = require('readline');
const path = require('path');
const ParseResults = require('./ParseResults.js');
const config = require('./Config');
const BankDatabase = require('./BankDatabase');
const util = require('./Util.js');

class BaseCSVParser {

    constructor(fileName) {
        // if (options) {
        this.fileName = fileName || "";
        // this.config = config;
        this.bankconfig = config[this.constructor.name];
        this.headers = []; // csv headers, override if needed.
        this.results = new ParseResults();
        this.db = new BankDatabase();

        // }
    }

    async parseOld(filePath) {

        // this.findAccountNumber()
        let csv
        if (this.headers && this.headers.length > 0) {
            csv = CSVParser(this.headers)
        } else {
            csv = CSVParser()
        }

        const stream = fs.createReadStream(filePath).pipe(csv);
        try {
            for await (const originalLine of stream) {
                this.results.lines++;
                try {
                    const processedLine = this.processLine(originalLine);
                    this.originalLine = originalLine
                    this.processedLine = processedLine

                    if (!processedLine) {
                        this.results.skipped++;
                        continue
                    }

                    this.results.setMinMaxDate("in_file", processedLine['datetime'])

                    const isAlreadyInserted = this.isAlreadyInserted(processedLine);
                    // console.log("Isalreadyinserted:",isAlreadyInserted)

                    let isValid = true;
                    try {
                        this.isRecordValid();

                        if (!isAlreadyInserted) {
                            let newid = this.saveTransaction(originalLine, processedLine);
                            this.results.insert(newid);

                            this.results.setMinMaxDate("inserts", processedLine['datetime'])
                        } else {
                            this.results.skipped++;
                            this.results.setMinMaxDate("skipped", processedLine['datetime'])
                        }
                    }
                    catch (error) {
                        // Handle the invalid record case
                        console.log('Invalid record encountered:', error);
                        this.results.invalid++; // Assuming you're tracking invalid records
                        // Other error handling logic here
                    }

                } catch (error) {
                    console.error("Error:", error);
                    // Handle the error appropriately
                }
            }
        } finally {
            // Close the stream
            stream.destroy();
        }

        this.results['file'] = path.basename(this.fileName);
        this.results['account'] = this.accountid
        this.results['parser'] = this.constructor.name
        // console.log(this.results)

        return this.results
    }

    async parse(filePath) {

        const csv = this.headers?.length > 0 ?
            CSVParser(this.headers) :
            CSVParser();

        const stream = fs.createReadStream(filePath).pipe(csv);

        try {
            for await (const originalLine of stream) {
                this.originalLine = originalLine
                this.results.lines++;
                await this.processLineAsync();
            }
        } catch (error) {
            console.error("Error processing file:", error);
        } finally {
            stream.destroy();
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
                // console.log("here1",  this.originalLine, this.processedLine)
                return;
            }

            this.results.setMinMaxDate("in_file", this.processedLine['datetime']);

            if (this.oldUniqueColumns) {
                await this.renameTransactionIDs();
            }

            if (this.isAlreadyInserted()) {
                this.results.skipped++;
                this.results.setMinMaxDate("skipped", this.processedLine['datetime']);

                // Call transactionSkipped if it has been defined in the subclass
                if (typeof this.transactionSkipped === 'function') {
                    this.transactionSkipped();
                }
                
            } else {
                await this.handleValidRecord();
            }
        } catch (error) {
            console.error("Error processing line:", error);
            this.results.invalid++;
        }
    }

    async handleValidRecord() {
        try {
            this.isRecordValid();
            const newId = this.saveTransaction();
            this.results.insert(newId);
            this.results.setMinMaxDate("inserts", this.processedLine['datetime']);

            // Call hasSaved if it has been defined in the subclass
            if (typeof this.transactionSaved === 'function') {
                this.transactionSaved(newId);
            }

        } catch (error) {
            console.log('Invalid record encountered:', error);
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
            this.processedLine['id'] = util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns)
        }

        this.processedLine['inserted_datetime'] = DateTime.now().toISO();
    }


    isAlreadyInserted() {

        let sha = util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns)
        const stmt = this.db.db.prepare("select id from 'transaction' where id=?");
        const r = stmt.all(sha); // get() for a single row, all() for multiple rows
        if (r.length > 1) throw new Error('Error: Multiple records found.');
        const exists = r.length === 1
        // if (exists) {
        //     console.log(`Exists\n-------\nOriginal: ${JSON.stringify(this.originalLine,null,"\t")}\nProcessed: ${JSON.stringify(this.processedLine,null,"\t")}\n${sha}`)
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
        const oldId = util.generateSHAFromObject(this.originalLine, this.processedLine, this.oldUniqueColumns);
        const newId = util.generateSHAFromObject(this.originalLine, this.processedLine, this.uniqueColumns);

        const updateTransaction = this.db.db.prepare("UPDATE 'transaction' SET id = ? WHERE id = ?");
        const updateEnriched = this.db.db.prepare("UPDATE 'transaction_enriched' SET id = ? WHERE id = ?");

        try {
            const transactionResult = updateTransaction.run(newId, oldId);
            if (transactionResult.changes > 0) {
                console.log(`Updated transaction record: ${oldId} to ${newId}`);
            }
        } catch (error) {
            console.log('Error updating transaction table:', error.message);
        }

        try {
            const enrichedResult = updateEnriched.run(newId, oldId);
            if (enrichedResult.changes > 0) {
                console.log(`Updated transaction_enriched record: ${oldId} to ${newId}`);
            }
        } catch (error) {
            console.log('Error updating transaction_enriched table:', error.message);
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
                    console.log(`setting accountid: ${accountid}`)
                    this.accountid = accountid
                    found = true; break;
                }
            }
        }
        catch (error) {
            console.log('error:', error)
        }
        return found;
    }

    async extractAccountBySecondLine() {

        // console.log(this);
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
                                console.log(`setting accountid: ${accountid}`)
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

}

module.exports = BaseCSVParser;
