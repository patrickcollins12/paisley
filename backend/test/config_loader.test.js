const fs = require('fs');
const os = require('os');
const path = require('path');

describe('config file', () => {

    const config = require('../src/Config');
    console.log(config)

    test('should be instantiated correctly', () => {
        expect(config).toBeDefined();
    });

});
