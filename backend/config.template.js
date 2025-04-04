// move this file to $HOME/paisley/config.js
const path = require('path');
const os = require('os');

const homedir = os.homedir();
const paisleydir = path.join(os.homedir(), "paisley");

module.exports = {
    csv_watch: path.join(paisleydir, "bank_statements"),
    csv_processed: path.join(paisleydir, "bank_statements/processed"),
    database: path.join(paisleydir, "transactions.db"),
    users_file: path.join(paisleydir, "users.json"),
    api_keys_file: path.join(paisleydir, "api_keys.json"),

    log_directory: path.join(paisleydir, "logs"),
    log_level: "info",

    // at what times should we scrape the accounts?
    enable_scraper: true,
    scrape_at_startup: false, // mostly useful for testing
    scheduled_scrape_cron: "01 * * * *", // scrape on the 1st minute of every hour. See node-cron
    scheduled_scrape_command: "npx playwright test --reporter json --retries 2",

    // This is the key used to sign the JWT tokens. It should be a random string.
    // remake the keys:
    // e.g 58c8edc963952d08d14fe0fd622897615ef48c94bbdbd5c692996e9e24d7153a
    // try using: openssl rand -hex 32
    jwt: "XXXX",

    paisleyUrl: "http://localhost:4000",
    paisleyApiKey: "<key>",

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
