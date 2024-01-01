const BaseCSVParser = require('../BaseCSVParser');
const { DateTime } = require("luxon");
// const moment = require('moment-timezone');

class RestSuperCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);
        return;

        this.identifier = 'rest_super'
        this.timezone = 'Australia/Sydney'
        this.dateFormat = 'DD/MM/YYYY'

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['date', 'balance' ]
    }

    matchesFileName(fileName) {
        return;
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.includes('rest_super');
    }

    processLine(l) {
        return;
        let processed = {}
        
        processed.datetime = new DateTime(l['date']).toISO();
        processed.account = this.config['account']
        processed.description = 'Balance check'
        processed.balance = l['balance']
        processed.type = "BAL";
        
        this.mustExistBeforeSaving = ['account','datetime','balance']

        console.log(processed)
        return processed
    }

}

module.exports = RestSuperCSVParser;