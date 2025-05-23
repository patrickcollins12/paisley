const BaseCSVParser = require('../src/BaseCSVParser');

class WestpacCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'westpac'
        this.timezone = 'Australia/Sydney'
        this.dateFormat = 'dd/MM/yyyy' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

        // what columns from the incoming csv file define a unique record
        // this.uniqueColumns = ['Date', 'Bank Account', 'Narrative', 'Balance' ]
        this.uniqueColumns = ['datetime', 'account', 'description', 'balance' ]
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
        
        processed.datetime = this.convertToLocalTime(l['Date']);

        let acc = l['Bank Account']
        try {
            acc = this.bankconfig.firstLinePatterns[acc];
        } catch {
            logger.error("this.bankconfig.firstLinePatterns is empty")
            return
        }

        processed.account = acc || l['Bank Account']

        processed.description = l['Narrative']
        // processed.amount = - l['Debit Amount'] || l['Credit Amount']
        processed.debit = l['Debit Amount']
        processed.credit = l['Credit Amount']
        processed.balance = l['Balance']
        processed.type = l['Categories']
        // logger.info(`csvline: ${l}`)

        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']
        
        return processed
    }

}

module.exports = WestpacCSVParser;