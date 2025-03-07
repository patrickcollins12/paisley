const fs = require('fs');
const BankDatabase = require('../src/BankDatabase');
const config = require('../src/Config');
const minimist = require('minimist');
const logger = require('../src/Logger');

// load command line arguments
const args = minimist(process.argv);

if (!args["config"]) throw new Error("Must supply --config <file>");
// let cfg = args["config"]
config.load(args["config"])
let db = new BankDatabase().db

if (!args["sql"]) throw new Error("Must supply --sql <file>");
let sqlFile = args["sql"];

try {
    const sql = fs.readFileSync(sqlFile, 'utf8');
    db.exec(sql);
    logger.info("All queries executed successfully.");
} catch (error) {
    logger.error(`Failed to execute queries: ${error}`);
}

db.close();