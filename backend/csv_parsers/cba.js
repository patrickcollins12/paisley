const BaseCSVParser = require('../src/BaseCSVParser');

class CBACSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'commonwealth bank'
        this.timezone = 'Australia/Sydney' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
        this.dateFormat = 'dd/MM/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // if headers is defined, then the csv parser will 
        // assume there is no header record in the file
        this.headers = ['Date','Amount','Description','Balance']
        this.uniqueColumns = ['datetime', 'description', 'debit', 'credit', 'balance' ]
        // what columns from the incoming csv file define a unique record
        // this.uniqueColumns = ['Date', 'Amount', 'Description', 'Balance' ]
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return this.matchFileExpands(fileName);
    }

    // static matchesSecondLine(firstDataLine) {
    //     // Logic to determine if this parser should handle the file based on the first data line
    //     return firstDataLine.includes('732002');
    // }


    // ['Date', 'Amount', 'Description', 'Balance' ]
    // 21/12/2023	-34118.18	Transfer to other Bank NetBank final paymnt izz	0.00
    // 20/12/2023	+14450.05	Direct Credit 062895 COMMONWEALTH SEC COMMSEC	+34118.18
    // 18/12/2023	-50000.00	Transfer to other Bank NetBank 1 of 2	+19668.13
    // 01/12/2023	+81.60	Credit Interest	+69668.13
    // 09/11/2023	+69491.51	Direct Credit 062895 COMMONWEALTH SEC COMMSEC	+69586.53
    // 01/11/2023	+95.02	Credit Interest	+95.02
    processLine(l) {
        let processed = {}
        
        processed.datetime = this.convertToLocalTime(l['Date']);
        
        processed.account = this.accountid

        // try {
        //     processed.account = this.config.accountExpands['CSVData'];
        // } catch {}

        processed.description = l['Description']
        // processed.amount = l['Amount']
        if (l['Amount']>=0) {
            processed.credit = l['Amount']            
            processed.debit = ""
        } else {
            processed.credit = ""
            processed.debit = - l['Amount']
        }
        
        

        processed.balance = l['Balance']

        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

        
        return processed
    }

}

module.exports = CBACSVParser;