const RuleApplyTester = require('./RuleApplyTester');
const minimist = require('minimist');
const config = require('./Config');
const args = minimist(process.argv);
config.load(args[config])

rules = new RuleApplyTester();
const response = rules.runSomeRules();


