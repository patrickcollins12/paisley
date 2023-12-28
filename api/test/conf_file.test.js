const fs = require('fs');
const os = require('os');
const path = require('path');


describe('config file', () => {
    const homedir = os.homedir()

    const config = require(`${homedir}/plaid/config.js`);

    // console.log(config)

    test('should be instantiated correctly', () => {
        expect(config).toBeDefined();
    });

    test('basic settings working correctly', () => {
        expect(config['app_name']).toBe("plaid");
        expect(config['app_dir']).toBe(path.join(homedir, "plaid"));
    });



});