const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment-timezone');

class BaseCSVParser {

     parse(filePath) {
        // let results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    const processedLine = this.processLine(data);
                    this.saveTransaction(processedLine)
                    // results.push(processedLine);
                } catch (error) {
                    console.log("Error:", error)
                    // reject(error);
                }
            });
            // .on('end', () => resolve())
            // .on('error', reject);
    }

    toUTC(datetime) {

        // function convertToUTC(dateString, timezone) {
        //     return 
        // }
        
        if (this.timezone === undefined) {
            throw new Error("this.timezone is undefined and must be implemented in the parser.");
        }
        // const tz = this.timezone
        // const yourDate = "2023-03-15T12:00:00"; // Example date
        // const timezone = "Australia/Sydney"; // AEST timezone
        // const utcDate = convertToUTC(datetime, timezone);
        return moment.tz(datetime, this.timezone).utc().format();
    }

    setDB(bankdb) {
        this.bankdb = bankdb
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
    saveTransaction(processedLine) {
        // console.log("Ready to save: ", processedLine)
    }

    processLine(line) {
        throw new Error('processLine() must be implemented in subclass');
    }

    matchesSecondLine(file) {
        throw new Error('matchesSecondLine() must be implemented in subclass');
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        throw new Error('matchesFileName() must be implemented in subclass');
    }

}

module.exports = BaseCSVParser;
