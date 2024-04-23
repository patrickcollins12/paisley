const RuleApply = require('./RuleApply');
const minimist = require('minimist');
const config = require('./Config');
const args = minimist(process.argv);
config.load(args[config])

rules = new RuleApply();
const response = rules.runSomeRules();


