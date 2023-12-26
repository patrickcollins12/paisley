const fs = require('fs');
const os = require('os');
const path = require('path');


describe('config file', () => {
    const homedir = os.homedir()

    const config = require(`${homedir}/pfm/config.js`);
    
    // console.log(config)

    test('should be instantiated correctly', () => {
        expect(config).toBeDefined();
    });

    
});