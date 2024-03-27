const BaseCSVParser = require('../src/BaseCSVParser');
const { DateTime } = require("luxon");

class GenericCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'generic'

        // generic insists that the timezone is on the created message
        // this.timezone = null
        // this.dateFormat = 'dd/MM/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['datetime', 'account' ]

    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('generic');
    }

    processLine(l) {
        // don't bother processing anything, just pass it through
        // we assume the creator knows the DB format
        let processed = { ...l }

        // but every record has to have an account and an ISO timestamp
        this.mustExistBeforeSaving = ['datetime','account']

        return processed
    }

}

module.exports = GenericCSVParser;