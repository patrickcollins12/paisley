const CSVParser = require('csv-parser');
const fs = require('fs');
const moment = require('moment-timezone');
const readline = require('readline');
const path = require('path');
const ParseResults = require('./ParseResults.js');
const config = require('./Config');
const BankDatabase = require('./BankDatabase');

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

    async parse(filePath) {

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

                    if (!processedLine) {
                        this.results.skipped++;
                        continue
                    }

                    this.results.setMinMaxDate("in_file", processedLine['datetime'])

                    const isAlreadyInserted = this.isAlreadyInserted(originalLine, processedLine);
                    // console.log("Isalreadyinserted:",isAlreadyInserted)

                    let isValid = true;
                    try {
                        this.isRecordValid(processedLine);

                        if (!isAlreadyInserted) {
                            this.saveTransaction(originalLine, processedLine);
                            this.results.inserted++;
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

    // async findAccountNumber() {
    //     if (!this.accountid){
    //         // this.extractAccountFromFileName();
    //         await this.extractAccountBySecondLine();
    //     }
    // }


    toUTC(datetime, dateFormat) {

        if (!this.timezone) {
            throw new Error("this.timezone is undefined and must be implemented in the parser.");
        }

        if (!this.dateFormat) {
            throw new Error("this.dateFormat is undefined and must be implemented in the parser.");
        }

        if (!moment.tz.zone(this.timezone)) {
            throw new Error("this.timezone specifies a strange and unknown timezone.");
        }

        return moment.tz(datetime, dateFormat, this.timezone).utc().format();
    }

    // CREATE TABLE "transaction" (
    //     "id"	INTEGER NOT NULL UNIQUE,
    //     "account"	TEXT,
    //     "description"	TEXT,
    //     "amount"	INTEGER,
    //     "datetime" TEXT,
    //     "balance"	INTEGER,
    //     "type"	INTEGER,
    //     PRIMARY KEY("id" AUTOINCREMENT)
    // );
    saveTransaction(originalLine, processedLine) {
        originalLine['file'] = path.basename(this.fileName);
        processedLine['jsondata'] = JSON.stringify(originalLine);

        const columns = Object.keys(processedLine).map(key => `"${key}"`).join(', ');

        const placeholders = Object.keys(processedLine).map(() => '?').join(', ');
        const sql = `INSERT INTO 'transaction' (${columns}) VALUES (${placeholders})`;
        // console.log('sql:', sql, processedLine)
        // Prepare and run the query with the data values
        const stmt = this.db.db.prepare(sql);
        stmt.run(Object.values(processedLine));
    }

    // SELECT * 
    // FROM data_table
    // WHERE 
    //     json_extract(json_data, '$.key1') = 'expected_value1' AND
    //     json_extract(json_data, '$.key2') = 'expected_value2' AND
    //     json_extract(json_data, '$.key3') = 'expected_value3' AND
    //     json_extract(json_data, '$.key4') = 'expected_value4';
    isAlreadyInserted(originalLine, processedLine) {
        let query = 'SELECT id FROM "transaction" t WHERE '

        // // what columns from the incoming csv file define a unique record
        // this.uniqueColumns = ['Date', 'Bank Account', 'Narrative', 'Balance' ]

        let ucs = [];
        let countEmptyColumnVal = 0;
        for (const uc of this.uniqueColumns) {
            let newVal = originalLine[uc] || '';
            if (!newVal) countEmptyColumnVal++;

            // Escape single quotes for SQL by replacing them with two single quotes
            let safeUc = uc.replace(/"/g, '""');
            let safeNewVal = newVal.replace(/'/g, "''");

            ucs.push(`json_extract(jsondata, '$."${safeUc}"') = '${safeNewVal}'`);
        }

        if (countEmptyColumnVal > 2) {
            this.results.invalid++;
            throw new Error("In the given transaction, 3 or more columns are undefined");
            return;
        }

        query += ucs.join(' AND ')

        try {
            // console.log('bankdb:',this.bankdb)
            const stmt = this.db.db.prepare(query);
            const result = stmt.all(); // get() for a single row, all() for multiple rows
            const rowCount = result ? result.length : 0;

            // console.log(`result: ${result}, resultCount: ${rowCount}` )

            if (rowCount > 1) {
                throw new Error(`Multiple matching rows already exist (${rowCount}) for `, originalLine)
            }

            return rowCount;

        } catch (err) {
            console.error("Database error:", err.message);
            throw err; // Rethrowing the error is optional, depends on how you want to handle it
        }


    }

    isRecordValid(line) {
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

    processLine(line) {
        throw new Error('processLine() must be implemented in subclass');
    }

    // matchesSecondLine(firstDataLine) {
    //     try {
    //         for (const [pattern, accountid] of Object.entries(config.firstLinePatterns)) {
    //             if (firstDataLine.includes(pattern)) {
    //                 this.accountid = accountid
    //                 console.log(`setting accountid: ${accountid}`)
    //                 return true
    //             }
    //         }
    //     } catch {}

    //     return false;
    // }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        throw new Error('matchesFileName() must be implemented in subclass');
    }

    matchFileExpands(fileName) {
        let found = false;
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

    // extractAccountFromFileName() {
    //     try {
    //         // config = {
    //         //    "accountExpands": {
    //         //        "Chase0378": "3222716XX 3162960YYY",
    //         //        "Chase7316": "3222716XX 5656297YYY"
    //         //    }
    //         // }
    //         var matches = this.fileName.match(/Chase(\d+)/ );
    //         if (matches) {
    //             var shortAccountName = matches[1];
    //             var longAccountName = config.accountExpands[shortAccountName]
    //             this.accountName = longAccountName;
    //         }
    //     } catch {}
    // }

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

// uses the dateFormat and timezone specified in the parser 
// to return an ISO time in that timezone
convertToLocalTime(datetime){
    return moment.tz(datetime, this.dateFormat, this.timezone).format();
}

}

module.exports = BaseCSVParser;
