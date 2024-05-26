const BaseCSVParser = require('../src/BaseCSVParser');

class BankwestCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'bankwest'
        this.timezone = 'Australia/Sydney' 
        this.dateFormat = 'dd/MM/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // what columns from the incoming csv file define a unique record
        // this.uniqueColumns = ['Transaction Date', 'Narration', 'Balance' ]
        this.uniqueColumns = ['datetime', 'description', 'credit','debit' ]
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.toLowerCase().includes('bankwest');
    }


    // BSB Number,Account Number,Transaction Date,Narration,Cheque,Debit,Credit,Balance,Transaction Type
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT WOOLWORTHS      1002  CHATSWOOD EASNS AU","",127.72,,145701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT AMAZON AU MARKETPLACE Sydney       000AU","",94.99,,145701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT CocaColaEPP           Castle Hill     AU","",4.00,,145701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT CocaColaEPP           Castle Hill     AU","",4.50,,145701.29,DAU
    // 302-985,1360851,29/09/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT GREENCROSS VETS       CHATSWOOD    000AU","",146.70,,145701.29,DAU
    // 302-985,1360851,02/10/2023,"MCDONALDS DT 0606 BEACON HILL AUS","",35.10,,145701.29,WDC
    // 302-985,1360851,02/10/2023,"SQ *ROTARY CLUB OF Chatswood AUS","",10.50,,145736.39,WDC
    // 302-985,1360851,02/10/2023,"VICTORIA'S BASEMEN CASTLE HILL AUS","",51.85,,145746.89,WDC
    // 302-985,1360851,02/10/2023,"WOOLWORTHS 10 CHATSWOOD EAS AUS","",34.55,,145798.74,WDC
    
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
        
        let narration = l['Narration']
        let str = ""
        str.toLower
        if (narration.toLowerCase().startsWith("authorisation only")) {
            // console.log(`Skipping ${narration}`)
            return null;
        }

        processed.datetime = this.convertToLocalTime(l['Transaction Date']);

        let bsb = l['BSB Number'].replace("-","")
        processed.account = bsb+" "+l['Account Number']
        processed.description = l['Narration']
        processed.debit =  Math.abs(l['Debit']) || 0
        processed.credit = Math.abs(l['Credit']) || 0
        processed.type = l['Transaction Type']
        processed.balance = l['Balance']

        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

        return processed
    }

}

module.exports = BankwestCSVParser;