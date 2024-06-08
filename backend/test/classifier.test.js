const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../src/Config');
const RulesClassifier = require('../src/RulesClassifier');
config.load()

describe('RulesClassifier Class', () => {
    beforeEach(() => {
        // RulesClassifier = require('../RulesClassifier');
    });

    test('should be instantiated correctly', () => {
        let rc = new RulesClassifier();
        expect(rc).toBeDefined();
    });

    test('<> prime should work', () => {
        let rc = new RulesClassifier();
        let transaction = {
            description: 'AMAZON PRIME SYDNEY SOUTH AUS',
        }
        let rule = "description: amazon; description: <>prime"
        // let ruleComponents = rc.parseRule(rule);
        // let test = rc.checkTransaction(transaction, ruleComponents)
        // expect(test).toBe(false);
    });



    // test('classify doc', () => {
    //     let rc = new RulesClassifier();
    //     rc.classifyId(65272)
    // });
});