const BaseCSVParser = require('../BaseCSVParser');
const moment = require('moment-timezone');

class CommsecCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'Commsec Australian Shares'
        this.timezone = 'Australia/Sydney'
        this.dateFormat = 'DD/MM/YYYY'

        // if headers is defined, then csv-parser will 
        // assume there is no header record in the file
        // this.headers = ['Date','Reference','Balance($)','Balance']

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Date', 'Reference', 'Balance($)' ]
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('Transactions_');
    }

    // Date	        Reference	Details	    Debit($)	Credit($)	Balance($)
    // 20/12/2023	P31642730	Direct Transfer - Payee MR PATRICK DEWAR COLLINS	14450.05		0.00
    // 18/12/2023	C148177126	S 400 IZZ @ 36.200000		14450.05	-14450.05

    processLine(l) {
        let processed = {}
        
        processed.datetime = this.convertToLocalTime(l['Date']);
        
        processed.account = this.accountid

        processed.description =  `${l['Details']} (Ref: ${l['Reference']})`
        // processed.amount = - l['Debit($)'] || l['Credit($)']
        processed.debit =  l['Debit($)']
        processed.credit = l['Credit($)']
        processed.balance = l['Balance($)']

        return processed
    }

}

module.exports = CommsecCSVParser;