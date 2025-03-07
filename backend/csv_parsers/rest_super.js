const BaseCSVParser = require('../src/BaseCSVParser');
const { DateTime } = require("luxon");

class RestCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'rest'

        this.timezone = 'Australia/Sydney' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
        this.dateFormat = 'dd/MM/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        this.mustExistBeforeSaving = ['datetime', 'description', 'debit or credit']
        this.uniqueColumns = ['datetime', 'description', 'debit', 'credit']

    }

    matchesFileName(fileName) {
        return this.matchFileExpands(fileName)
    }

    // Received	TransactionType	Total($)
    // 28/02/2025	Administration Fee	-6
    // 28/02/2025	Admin Fee (%)	-50
    // 31/01/2025	Administration Fee	-7.5
    processLine(l) {
        // don't bother processing anything, just pass it through
        // we assume the creator knows the DB format
        let processed = {}
        processed.account = this.accountid
        processed.datetime = this.convertToLocalTime(l['Received']);
        processed.description =  l['TransactionType']
        const amount = l['Total($)']
        if (amount>=0) {
            processed.credit = amount
        } else {
            processed.debit = Math.abs(amount)
        }
        
        return processed
    }

}

module.exports = RestCSVParser;