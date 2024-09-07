const BaseCSVParser = require('../src/BaseCSVParser');
const { DateTime } = require("luxon");

class BankwestCSVParser extends BaseCSVParser {

    constructor(options) {
        super(options);

        this.identifier = 'bankwest'
        // this.timezone = 'Australia/Perth' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
        this.dateFormat = 'dd/MM/yyyy'  // uses luxon date format: https://moment.github.io/luxon/#/parsing?id=table-of-tokens

        // what columns from the incoming csv file define a unique record
        this.uniqueColumns = ['Transaction Date', 'Narration', 'Credit', 'Debit']
        // this.oldUniqueColumns = ['Transaction Date', 'Narration', 'Credit', 'Debit' ]
        // this.uniqueColumns = ['datetime', 'description', 'credit', 'debit', 'balance']
        // this.oldUniqueColumns = ['datetime', 'description', 'credit', 'debit']

        // this.warnUniqueColumns = ['Transaction Date', 'Narration', 'Credit', 'Debit', 'Balance' ]

    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        return fileName.toLowerCase().includes('bankwest');
    }

    // BSB Number,Account Number,Transaction Date,Narration,Cheque,Debit,Credit,Balance,Transaction Type
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT WOOLWORTHS      1002  CHATSWOOD EASNS AU","",127.72,,15701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT AMAZON AU MARKETPLACE Sydney       000AU","",94.99,,15701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT CocaColaEPP           Castle Hill     AU","",4.00,,15701.29,DAU
    // 302-985,1360851,02/10/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT CocaColaEPP           Castle Hill     AU","",4.50,,15701.29,DAU
    // 302-985,1360851,29/09/2023,"AUTHORISATION ONLY - EFTPOS PURCHASE AT GREENCROSS VETS       CHATSWOOD    000AU","",146.70,,15701.29,DAU
    // 302-985,1360851,02/10/2023,"MCDONALDS DT 0606 BEACON HILL AUS","",35.10,,15701.29,WDC
    // 302-985,1360851,02/10/2023,"SQ *ROTARY CLUB OF Chatswood AUS","",10.50,,15736.39,WDC
    // 302-985,1360851,02/10/2023,"VICTORIA'S BASEMEN CASTLE HILL AUS","",51.85,,15746.89,WDC
    // 302-985,1360851,02/10/2023,"WOOLWORTHS 10 CHATSWOOD EAS AUS","",34.55,,15798.74,WDC

    // CREATE TABLE "transaction" (
    //     "id"	INTEGER NOT NULL UNIQUE,
    //     "account"	TEXT,
    //     "description"	TEXT,
    //     "amount"	INTEGER,
    //     "balance"	INTEGER,
    //     "type"	INTEGER,
    //     PRIMARY KEY("id" AUTOINCREMENT)
    // );
    extractDateFromDescription(processed) {
        let re = RegExp(/(\d\d?):(\d\d)([AP]M) (\d\d?)(\w{3})\b/, "i")
        // let str2 = 'blah 05:04PM 27Jul h'
        let desc = processed.description

        let match = desc.match(re)
        if (match) {
            let [full, hr, min, ampm, date, month] = match
            let orig_datetime = processed.datetime
            let year = DateTime.fromISO(orig_datetime).year

            // See https://github.com/moment/luxon/blob/master/docs/parsing.md#table-of-tokens
            let parsable = `${month} ${parseInt(date)}, ${year}, ${parseInt(hr)}:${min} ${ampm}`

            let new_datetime = DateTime.fromFormat(parsable, "ff", { zone: this.timezone })

            let revised_description = desc.replace(re, "")
            console.log(`Revised ${orig_datetime} to ${new_datetime} based on ${desc}`)
            console.log(`Revised description ${revised_description}`)
            processed.revised_description = revised_description
            processed.datetime = new_datetime.toISO()
            return true
        }
        else {
            return false
        }
    }

    processLine(l) {
        let processed = {}

        let narration = l['Narration']
        let str = ""
        str.toLower

        if (narration.toLowerCase().startsWith("authorisation only")) {
            // console.log(`Skipping ${narration}`)
            return null;
        }

        processed.description = l['Narration']

        // Scrape this and add it to the year given in the original datetime
        // 05:04PM 27Jul
        processed.datetime = this.convertToLocalTime(l['Transaction Date']);

        if (this.extractDateFromDescription(processed)) {
            // console.log("datetime >>", processed.datetime)
            // console.log("description >>", processed.description)    
            // console.log("revised_description >>", processed.revised_description)  
            // console.log("")  
        }

        let bsb = l['BSB Number'].replace("-", "")
        processed.account = bsb + " " + l['Account Number']
        processed.debit = Math.abs(l['Debit']) || 0
        processed.credit = Math.abs(l['Credit']) || 0
        processed.type = l['Transaction Type']
        processed.balance = l['Balance']

        this.mustExistBeforeSaving = ['datetime', 'account', 'description', 'debit or credit', 'balance']

        return processed
    }

}

module.exports = BankwestCSVParser;