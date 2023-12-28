const util = require('../ScraperUtil');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { unlink, readFile} = require('fs').promises;

describe('csv saver', () => {
    const homedir = os.homedir()

    const config = require(`${homedir}/plaid/config.js`);

    test('should be instantiated correctly', () => {
        expect(config).toBeDefined();
    });

    let data = [
        {
            "account": "123",
            "balance": 156.00,
            "description": "Test Description 1"
        },
        {
            "account": "123",
            "balance": 154.00,
            "description": "Test Description 2"
        },
        {
            "account": "123",
            "balance": 152.00,
            "description": "Test Description 3"
        },
    ]

    let fn = `/tmp/csv_writer_test_${process.pid}.csv`
    test('file should save correctly', async () => {

        // console.log(fn)
        await util.saveDataToCSV(fn, data);
        expect(data).toBeDefined();
        expect(fs.existsSync(fn)).toBe(true);
    });

    test('file should cat', async () => {
        const content = await readFile(fn, 'utf8');
        let lines = content.split('\n').length -2;
        // console.log(content, lines);
        // console.log(data.length);
        
        expect(lines === data.length).toBe(true);

    });

    test('file should be removed', async () => {
        await unlink(fn);
        // console.log(`${fn} was deleted`);
        expect(fs.existsSync(fn)).toBe(false);


    });

});