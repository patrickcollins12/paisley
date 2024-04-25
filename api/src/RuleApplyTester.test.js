const RuleApplyTester = require('./RuleApplyTester');
const minimist = require('minimist');
const config = require('./Config');
const args = minimist(process.argv);
config.load(args[config])

describe('Rule application', () => {
    let parser;
  
    beforeEach(() => {
      rules = new RuleApplyTester(); // Initialize a new instance of the parser for each test
    });
 
    test('test loading 10 rules', () => {
        const response = rules.runSomeRules();
        expect(response).toEqual(true);
      });
    

});

