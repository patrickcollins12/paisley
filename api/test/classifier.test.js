const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../Config');
const RulesClassifier = require('../RulesClassifier');

describe('RulesClassifier Class', () => {
    beforeEach(() => {
        // RulesClassifier = require('../RulesClassifier');
    });

    test('should be instantiated correctly', () => {
        let rc = new RulesClassifier();
        expect(rc).toBeDefined();
    });

    // test('classify doc', () => {
    //     let rc = new RulesClassifier();
    //     rc.classifyId(65272)
    // });
});