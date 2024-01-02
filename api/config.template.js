// move this file to $HOME/paisley/config.js

const path = require('path');
const os = require('os');

const homedir = os.homedir();
const app_name = "paisley"

module.exports = {
    app_name: app_name,
    app_dir: path.join(homedir, app_name),
    database: path.join(homedir, app_name, "transactions.db"),
    csv_watch: path.join(homedir, "Downloads/bank_statements"),
    csv_processed: path.join(homedir, "Downloads/bank_statements/processed"),

    /////////
    // Bankwest
    BankwestCSVParser: {
        identifier: "bankwest",
        firstLinePatterns: {
            "AAA-BBB,XXX0851": "XXXXXX XXX0851",
            "AAA-BBB,YYY8636": "YYYYYY YYY8636"
        }
    },

    BankwestScraper: {
        identifier: "bankwest",
        pan: "<PutYourAccountIDHere>",
        password: "MyBankPassword"
    },

    ///////////////
    GenericCSVParser: {
        identifier: "generic"
    }
};
