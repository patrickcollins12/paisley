const BaseCSVParser = require('../BaseCSVParser');
const { DateTime } = require("luxon");
const util = require('../ScraperUtil');

class UbankCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'ubank'
        this.timezone = 'Australia/Sydney' 
        this.dateFormat = 'dd MMM yyyy'

    }

    matchesFileName(fileName) {
        return this.matchFileExpands(fileName);
    }

    // Date	Description	Debit	Credit	Balance
    // 01 Apr 2020	Slide N Shake 	$44.20		+$469.99
    // 04 Apr 2020	Thai Tucka 	$42.70		+$427.29
    // 05 Apr 2020	The Asian Theory 	$4.00		+$423.29
    processLine(l) {
        let processed = {}
        
        processed.datetime = DateTime.fromFormat(l['Date'], this.dateFormat).setZone(this.timezone).toISO();
        processed.account = this.accountid
        processed.description = l['Description']
        // let cleanBalance = util.cleanPrice(rawBalance);

        processed.debit =  Math.abs(util.cleanPrice(l['Debit'])) || ""
        processed.credit = Math.abs(util.cleanPrice(l['Credit'])) || ""
        processed.balance = l['Balance']

        this.uniqueColumns = ['Date', 'Description', 'Balance' ]
        this.mustExistBeforeSaving = ['datetime','account','description','debit or credit','balance']

        return processed
    }

}

module.exports = UbankCSVParser;