// Use require('path') and require('os') if you need to resolve paths or environment variables
const path = require('path');
const os = require('os');

const homedir = os.homedir();
const paisleydir = path.join(homedir,"paisley");

module.exports = {
    csv_watch:     path.join(paisleydir,   "demo/bank_statements"),
    csv_processed: path.join(paisleydir,   "demo/bank_statements/processed"),
    database:      path.join(paisleydir,   "demo/demo_transactions.db"),
    users_file:    path.join(paisleydir,   "users.json"),
    api_keys_file: path.join(paisleydir, "api_keys.json"),

    log_directory: path.join(paisleydir, "logs"),
    log_level: "info",


    // at what times should we scrape the accounts?
    enable_scraper: true,
    scrape_at_startup: false,
    scheduled_scrape_cron: "01 * * * *", // on the 5th minute of every hour. See node-cron
    scheduled_scrape_command: "npx playwright test --reporter json --retries 2",

    // This is the key used to sign the JWT tokens. It should be a random string.
    // remake the keys:
    // e.g 58c8edc963952d08d14fe0fd622897615ef48c94bbdbd5c692996e9e24d7153a
    // try using: openssl rand -hex 32
    // generateRandom32CharHexString() {  // 32 bytes = 256 bits
    //     return require('crypto').randomBytes(32).toString('hex');
    // },
    jwt: "XXXX",


    TestdataCSVParser: {
        identifier: "generic_test_data",
    },

};
