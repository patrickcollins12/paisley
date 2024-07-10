// system imports
const os = require('os');
const path = require('path');
const minimist = require('minimist');

// load command line arguments
const args = minimist(process.argv);

// load the config
const config = require('../src/Config');
// console.log("args:",args);
config.load(args["config"])

const RulesClassifier = require('../src/RulesClassifier');
// const BankDatabase = require('./src/BankDatabase');
const classifier = new RulesClassifier()

// CLASSIFY THE RECENTLY ADDED TRANSACTIONS
console.log("ready to classify")
classifier.applyAllRules()
console.log("Finished processing");
