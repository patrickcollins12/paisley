// Use require('path') and require('os') if you need to resolve paths or environment variables
const path = require('path');
const os = require('os');
const homedir = os.homedir();
const paisleydir = path.join(homedir,"paisley");

module.exports = {
    csv_watch:     path.join(paisleydir,   "demo/bank_statements"),
    csv_processed: path.join(paisleydir,   "demo/bank_statements/processed"),
    database:      path.join(paisleydir,   "demo/demo_transactions.db"),
    rules:         path.join(paisleydir,   "demo/demo_rules.js"),
    users_file:    path.join(paisleydir,   "users.json"),

    TestdataCSVParser: {
        identifier: "generic_test_data",
    },

};
