const BaseCSVParser = require('../BaseCSVParser');
class GenericCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'generic'

        // this generic importer insists that the timezone is on the created message in the CSV
        // this.timezone = null
        // this.dateFormat = 'DD/MM/YYYY'

        // what columns from the incoming csv file define a unique record?
        // for generic it is assumed the datetime has milliseconds, so it should uniquely define the record
        this.uniqueColumns = ['datetime', 'account' ]

        // every record has to have an account and an ISO timestamp with millieseconds
        this.mustExistBeforeSaving = ['datetime','account']

    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('generic');
    }

    processLine(l) {
        // don't bother processing anything, just pass it through
        // we assume the creator knows the DB format
        let processed = { ...l }

        return processed
    }

}

module.exports = GenericCSVParser;