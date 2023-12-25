const BaseCSVParser = require('../BaseCSVParser');
// const moment = require('moment-timezone');

class ChaseCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);
        
        this.identifier = 'chase'
        this.timezone = 'America/Los_Angeles' 
        this.dateFormat = 'MM/DD/YYYY'

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Posting Date', 'Description', 'Amount', 'Balance' ]
    }


    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.toLowerCase().includes('chase');
    }


    // Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
    // DEBIT,11/07/2023,"TRANSFER TO SAV XXXXX7316 11/07",-5.00,ACCT_XFER,3153.40,,
    // DEBIT,11/06/2023,"VENMO            PAYMENT    1030380922540   WEB ID: 3264681992",-86.00,ACH_DEBIT,3158.40,,
    // CREDIT,11/06/2023,"VENMO            CASHOUT                    PPD ID: 5264681992",44.00,ACH_CREDIT,3244.40,,
    // DEBIT,11/02/2023,"PAYPAL           INST XFER  PRIVATEINTE     WEB ID: PAYPALSI77",-6.95,ACH_DEBIT,3200.40,,
    // DEBIT,11/02/2023,"BLINKS LABS GMBH IAT PAYPAL 1030360508017   WEB ID: 770510487C",-79.99,ACH_DEBIT,3207.35,,
    // DEBIT,10/31/2023,"MONTHLY SERVICE FEE",-35.00,FEE_TRANSACTION,3287.34,,

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
        
        processed.datetime = this.toUTC(l['Posting Date'],this.dateFormat); // requires date format defined above.
        processed.account = this.accountid
        processed.description = l['Description']
        // processed.amount =  (l['Details'] === "DEBIT") ? -l['Amount'] : l['Amount']
        processed.debit  =  (l['Details'] === "DEBIT")  ? -l['Amount'] : "";
        processed.credit =  (l['Details'] === "CREDIT") ? l['Amount'] : "";

        processed.type = l['Type']
        processed.balance = l['Balance']
        // console.log("csvline:",l)

        return processed
    }

}

module.exports = ChaseCSVParser;