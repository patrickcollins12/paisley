const fs = require('fs');
const os = require('os');

const path = require('path');
const CM = require('../ConfigManager.js');

describe('Config Manager Class', () => {
    let cm;

    const configFileDir = path.join(os.homedir(), '.testingapp');
    const configFilePath = path.join(configFileDir, 'config.json');

    beforeEach(() => {
        // Clean up any existing config file before each test
        if (fs.existsSync(configFilePath)) {
            fs.unlinkSync(configFilePath);
        }
        cm = new CM('testingapp');
    });


    afterAll(() => {
        if (fs.existsSync(configFileDir)) {
            // fs.unlinkSync(configFileDir);
            fs.rm(configFileDir, { recursive: true }, () => {});
        }
    });
  

    test('should be instantiated correctly', () => {
        expect(cm).toBeDefined();
    });

    test('should create default config if none exists', () => {
        const config = cm.readConfig();
        expect(config).toBeDefined();
        // expect(config.setting1).toBe('defaultValue1'); // Replace with your actual default values
    });

    test('should read existing config', () => {
        const sampleConfig = { setting1: 'testValue' };
        cm.writeConfig(sampleConfig);
        const readConfig = cm.readConfig();
        expect(readConfig.setting1).toBe('testValue');
    });

    test('should write config correctly', () => {
        const newConfig = { setting1: 'newValue1' };
        cm.writeConfig(newConfig);

        const rawConfig = fs.readFileSync(configFilePath);
        const writtenConfig = JSON.parse(rawConfig);
        expect(writtenConfig.setting1).toBe('newValue1');
    });

    test('see if an append of a new value works', () => {

        // Setup the first file
        let c1 = {'setting1': 'newValue1'}
        cm.writeConfig(c1);

        // Add an entry and save it
        const c2 = cm.readConfig();
        c2['setting2'] = 'newValue2'
        cm.writeConfig(c2);

        // Now re-read it
        const c3 = cm.readConfig();

        expect(c3.setting1).toBe("newValue1");
        expect(c3.setting2).toBe("newValue2");
    });
    
});


