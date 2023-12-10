const BaseCSVParser = require('../BaseCSVParser');

class WestpacCSVParser extends BaseCSVParser {

    constructor() {
        super();
        this.identifier = 'westpac'
        this.timezone = 'Australia/Sydney'

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Date', 'Bank Account', 'Narrative', 'Balance' ]
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('westpac');
    }

    matchesSecondLine(firstDataLine) {
        // Logic to determine if this parser should handle the file based on the first data line
        return firstDataLine.includes('732002');
    }

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
        l.datetime = l['Date']
        l.account = l['Bank Account']
        l.description = l['Narrative']
        l.amount = l['Debit Amount'] || - l['Credit Amount']
        l.balance = l['Balance']
        l.type = l['Categories']
        // console.log("csvline:",l)

        return l
    }

}

module.exports = WestpacCSVParser;