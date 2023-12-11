const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment-timezone');

class BaseCSVParser {

    async parse(filePath) {
        const stream = fs.createReadStream(filePath).pipe(csv());

        for await (const originalLine of stream) {
            try {
                const processedLine = this.processLine(originalLine);
                const isAlreadyInserted = this.isAlreadyInserted(originalLine,processedLine);
                // console.log("Isalreadyinserted:",isAlreadyInserted)
                if (! isAlreadyInserted) {
                    this.saveTransaction(originalLine,processedLine);
                }
            } catch (error) {
                console.error("Error:", error);
                // Handle the error appropriately
            }
        }
    }

    toUTC(datetime,dateFormat) {
        
        if (! this.timezone ) {
            throw new Error("this.timezone is undefined and must be implemented in the parser.");
        }

        if (! this.dateFormat ) {
            throw new Error("this.dateFormat is undefined and must be implemented in the parser.");
        }

        if (! moment.tz.zone(this.timezone)) {
            throw new Error("this.timezone specifies a strange and unknown timezone.");
        }

        return moment.tz(datetime, dateFormat, this.timezone).utc().format();
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
    saveTransaction(originalLine, processedLine) {
        // console.log("Ready to save: ", processedLine)
        // const columns = Object.keys(processedLine).join(', ');
        processedLine['jsondata'] = JSON.stringify(originalLine);
        const columns = Object.keys(processedLine).map(key => `"${key}"`).join(', ');

        const placeholders = Object.keys(processedLine).map(() => '?').join(', ');
        const sql = `INSERT INTO 'transaction' (${columns}) VALUES (${placeholders})`;
        // console.log('sql:', sql, processedLine)
        // Prepare and run the query with the data values
        const stmt = this.bankdb.db.prepare(sql);
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
            throw new Error("In the given transaction, 3 or more columns are undefined");
            return;
        }
        
        query += ucs.join(' AND ')

        try {
            // console.log('query:',query)
            const stmt = this.bankdb.db.prepare(query);
            const result = stmt.all(); // get() for a single row, all() for multiple rows
            const rowCount = result ? result.length : 0;

            // console.log(`result: ${result}, resultCount: ${rowCount}` )

            if (rowCount>1) {
                throw new Error(`Multiple matching rows already exist (${rowCount}) for `, originalLine)
            }
    
            return rowCount; 
    
        } catch (err) {
            console.error("Database error:", err.message);
            throw err; // Rethrowing the error is optional, depends on how you want to handle it
        }


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
