const BaseCSVParser = require('../BaseCSVParser');
// const moment = require('moment-timezone');

class BankwestCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'bankwest'
        this.timezone = 'Australia/Sydney' 
        this.dateFormat = 'DD/MM/YYYY'

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Transaction Date', 'Narration', 'Balance' ]
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
        
        processed.datetime = this.toUTC(l['Transaction Date'],this.dateFormat); // requires date format defined above.
        // processed.account = l['BSB Number'] + " " + l['Account Number']
        let bsb = l['BSB Number'].replace("-","")
        processed.account = bsb+" "+l['Account Number']
        processed.description = l['Narration']
        processed.amount = - l['Debit'] || l['Credit']
        processed.type = l['Transaction Type']
        processed.balance = l['Balance']
        // console.log("csvline:",l)

        return processed
    }

}

module.exports = BankwestCSVParser;