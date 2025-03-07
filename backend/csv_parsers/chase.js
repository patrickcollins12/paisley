const BaseCSVParser = require('../src/BaseCSVParser');
const logger = require('../src/Logger');

class ChaseCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'chase'
        this.timezone = 'America/Los_Angeles' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
        this.dateFormat = 'MM/dd/yyyy' // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // what columns from the incoming csv file define a unique record
        // this.uniqueColumns = ['Posting Date', 'Description', 'Amount', 'Balance']
        this.uniqueColumns = ['datetime', 'description', 'debit', 'credit', 'balance']
        this.mustExistBeforeSaving = ['datetime', 'account', 'description', 'debit or credit', 'balance']

    }

    matchesFileName(fileName) {
        return this.matchFileExpands(fileName)
    }

    // Transaction Date, Post Date, Description,Category, Type, Amount, Memo
    // Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #

    // DEBIT,11/07/2023,"TRANSFER TO SAV XXXXX7316 11/07",-5.00,ACCT_XFER,3153.40,,
    // DEBIT,11/06/2023,"VENMO            PAYMENT    1030380922540   WEB ID: 3264681992",-86.00,ACH_DEBIT,3158.40,,
    // CREDIT,11/06/2023,"VENMO            CASHOUT                    PPD ID: 5264681992",44.00,ACH_CREDIT,3244.40,,
    // DEBIT,11/02/2023,"PAYPAL           INST XFER  PRIVATEINTE     WEB ID: PAYPALSI77",-6.95,ACH_DEBIT,3200.40,,
    // DEBIT,11/02/2023,"BLINKS LABS GMBH IAT PAYPAL 1030360508017   WEB ID: 770510487C",-79.99,ACH_DEBIT,3207.35,,
    // DEBIT,10/31/2023,"MONTHLY SERVICE FEE",-35.00,FEE_TRANSACTION,3287.34,,
    processLine(l) {
        let processed = {}

        processed.description = l['Description']

        // Skip any descriptions starting with PREAUTH
        if (processed.description.toLowerCase().startsWith("PREAUTH")) {
            logger.info(`Skipping ${narration}`)
            return null;
        }

        processed.datetime = this.convertToLocalTime(l['Posting Date']);

        processed.account = this.accountid

        if (l['Details'] === "DEBIT" || l['Details'] === "CHECK") {
            processed.debit = -l['Amount'];
        } else {
            // processed.credit = l['Amount'];
            processed.credit = l['Amount'];
        }

        processed.type = l['Type']
        processed.balance = l['Balance']
        // console.log("csvline:",l)

        return processed
    }

}

module.exports = ChaseCSVParser;