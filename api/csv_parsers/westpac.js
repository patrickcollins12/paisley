const BaseCSVParser = require('../BaseCSVParser');
// const moment = require('moment-timezone');

class WestpacCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'westpac'
        this.timezone = 'Australia/Sydney'
        this.dateFormat = 'DD/MM/YYYY'

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Date', 'Bank Account', 'Narrative', 'Balance' ]
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('westpac');
    }

    // static matchesSecondLine(firstDataLine) {
    //     // Logic to determine if this parser should handle the file based on the first data line
    //     return firstDataLine.includes('732002');
    // }

    // csvline: {   
    //     'Bank Account': '732002671776',
    //     Date: '06/10/2023',
    //     Narrative: 'EFTPOS DEBIT 0464015 MANOOSH PIZZERIA\\             06/10',
    //     'Debit Amount': '75.89',
    //     'Credit Amount': '',
    //     Balance: '5148.13',
    //     Categories: 'POS',
    //     Serial: ''
    //   }      
    // CREATE TABLE "transaction" (
    //     "id"	INTEGER NOT NULL UNIQUE,
    //     "account"	TEXT,
    //     "description"	TEXT,
    //     "amount"	INTEGER,
    //     "balance"	INTEGER,
    //     "type"	INTEGER,
    //     PRIMARY KEY("id" AUTOINCREMENT)
    // );
    processLine(l) {
        let processed = {}
        
        processed.datetime = this.toUTC(l['Date'],this.dateFormat); // requires date format defined above.
        // processed.account = l['Bank Account']
        processed.account = this.accountid
        processed.description = l['Narrative']
        processed.amount = - l['Debit Amount'] || l['Credit Amount']
        processed.balance = l['Balance']
        processed.type = l['Categories']
        // console.log("csvline:",l)

        return processed
    }

}

module.exports = WestpacCSVParser;