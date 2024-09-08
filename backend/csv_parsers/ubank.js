const BaseCSVParser = require('../src/BaseCSVParser');
const { DateTime } = require("luxon");
const util = require('../src/ScraperUtil');

class UbankCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'ubank'
        this.timezone = 'Australia/Sydney' 
        this.dateFormat = 'dd MMM yyyy' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

        this.uniqueColumns = ['datetime', 'description', 'balance' ]
        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

    }

    matchesFileName(fileName) {
        return this.matchFileExpands(fileName);
    }

    // matchesFileName(fileName) {
    //     // Logic to determine if this parser should handle the file based on the file name
    //     return fileName.toLowerCase().includes('SpendAccount-5689');
    // }


    // Date	Description	Debit	Credit	Balance
    // 01 Apr 2020	Slide N Shake 	$44.20		+$469.99
    // 04 Apr 2020	Thai Tucka 	$42.70		+$427.29
    // 05 Apr 2020	The Asian Theory 	$4.00		+$423.29
    processLine(l) {
        let processed = {}
        
        // processed.datetime = DateTime.fromFormat(l['Date'], this.dateFormat).setZone(this.timezone).toISO();
        processed.datetime = this.convertToLocalTime(l['Date']);

        processed.account = this.accountid
        processed.description = l['Description']
        // let cleanBalance = util.cleanPrice(rawBalance);

        processed.debit =  Math.abs(util.cleanPrice(l['Debit'])) || ""
        processed.credit = Math.abs(util.cleanPrice(l['Credit'])) || ""
        processed.balance = util.cleanPrice(l['Balance']) || ""

        

        return processed
    }

}

module.exports = UbankCSVParser;