// system imports
const os = require('os');
const path = require('path');
const minimist = require('minimist');
const logger = require('../src/Logger');

// load command line arguments
const args = minimist(process.argv);

// load the config
const config = require('../src/Config');
// logger.info(`args: ${args}`);
config.load(args["config"])

const RulesClassifier = require('../src/RulesClassifier');
// const BankDatabase = require('./src/BankDatabase');
const classifier = new RulesClassifier()

// CLASSIFY THE RECENTLY ADDED TRANSACTIONS
logger.info("ready to classify")
classifier.applyAllRules()
logger.info("Finished processing");
