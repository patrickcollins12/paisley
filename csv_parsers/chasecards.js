const BaseCSVParser = require('../src/BaseCSVParser');

class ChaseCardsCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);
        
        this.identifier = 'chasecard'
        this.timezone = 'America/Los_Angeles' 
        this.dateFormat = 'MM/dd/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // what columns from the incoming csv file define a unique record
            // Transaction Date,Post Date,Description,Category,Type,Amount,Memo
        // this.uniqueColumns = ['Transaction Date', 'Description', 'Amount' ]
        this.uniqueColumns = ['datetime', 'description', 'credit','debit' ]
        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit']
    }


    matchesFileName(fileName) {
        return this.matchFileExpands(fileName)
    }

    // Transaction Date,Post Date,Description,Category,Type,Amount,Memo
    // 12/15/2023,12/17/2023,WNYC WQXR NJPR NYPR RADIO,Gifts & Donations,Sale,-5.00,
    // 12/15/2023,12/15/2023,AUTOMATIC PAYMENT - THANK,,Payment,305.00,
    // 11/15/2023,11/16/2023,WNYC WQXR NJPR NYPR RADIO,Gifts & Donations,Sale,-5.00,
    // 11/15/2023,11/15/2023,AUTOMATIC PAYMENT - THANK,,Payment,1874.66,
    processLine(l) {
        let processed = {}
        
        processed.datetime = this.convertToLocalTime(l['Transaction Date']);

        processed.account = this.accountid
        processed.description = [l['Description'], l['Memo']].join(" ");
        // processed.amount =  (l['Details'] === "DEBIT") ? -l['Amount'] : l['Amount']
        if (l['Amount'] <0 ) {
            processed.credit =  Math.abs(l['Amount'])
        } else {
            processed.debit  =  Math.abs(l['Amount'])
        }

        processed.type = l['Type']
        processed.balance = l['Balance']
        // console.log("csvline:",l)

        return processed
    }

}

module.exports = ChaseCardsCSVParser;