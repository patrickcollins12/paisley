// Use require('path') and require('os') if you need to resolve paths or environment variables
const path = require('path');
const os = require('os');
const homedir = os.homedir();

module.exports = {
    csv_watch:     path.join(homedir,   "paisley/demo/bank_statements"),
    csv_processed: path.join(homedir,   "paisley/demo/bank_statements/processed"),
    database:      path.join(homedir,   "paisley/demo/demo_transactions.db"),
    rules:         path.join(homedir,   "paisley/demo/demo_rules.js"),

    TestdataCSVParser: {
        identifier: "generic_test_data",
    },

};
