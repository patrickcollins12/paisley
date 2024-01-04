const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../Config');

describe('FileMover Class', () => {
    beforeEach(() => {
        // BankDatabase = require('../BankDatabase');
        fs.mkdirSync("/tmp/basedir", { recursive: true });
        fs.writeFileSync('/tmp/basedir/file.csv', '');

    });

    afterEach(() => {
        // fs.rmSync('/tmp/basedir', { recursive: true, force: true });

    });

    test('should be instantiated correctly', () => {
        const FileMover = require('../FileMover');
        expect(FileMover).toBeDefined();
    });

    test('can move a file', done => {
        // expect(FileMover).toBeDefined();
        const FileMover = require('../FileMover');
        FileMover.moveFile("/tmp/basedir", "/tmp/basedir/file.csv", "/tmp/basedir/processed/file.csv",(err) => {
            if (err) {
                // Error handling
                console.log("Error")
                done(err); // Call done with the error
            } else {
                console.log("Good")
                const fileExists = fs.existsSync("/tmp/basedir/processed/file.csv");
                expect(fileExists).toBe(true);
                done(); // Call done with the error
            }
        });

    });

    test('can move a file in a subdirectory of basedir', async () => {
        // expect(FileMover).toBeDefined();
        const FileMover = require('../FileMover');
        fs.mkdirSync(    "/tmp/basedir/ubank", { recursive: true });
        fs.writeFileSync('/tmp/basedir/ubank/file.csv', '');

        await FileMover.moveFile("/tmp/basedir", "/tmp/basedir/ubank/file.csv", "/tmp/basedir/processed");
        const fileExists = fs.existsSync("/tmp/basedir/processed/ubank/file.csv");
        expect(fileExists).toBe(true);
        
    });

});