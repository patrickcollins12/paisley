const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../src/Config');
config.load()

describe('BankDatabase Class', () => {
    let BankDatabase
    let db;

    beforeEach(() => {
        BankDatabase = require('../src/BankDatabase');
    });

    test('should be instantiated correctly', () => {
        db = new BankDatabase();
        expect(db).toBeDefined();
    });

    test('should have an open database connection after instantiation', () => {
        db = new BankDatabase();
        expect(db.db.open).toBe(true);
    });

    test('should create a new bank database', () => {
        db = new BankDatabase("/tmp/test.db");
        expect(db.db).toBeUndefined();

        // expect(db.db.open).toBe(false);
    });

    test('should pass back the singleton', () => {
        let db = new BankDatabase();
        expect(db.db).toBeDefined();
        expect(db.db.open).toBe(true);

        // should pass back the singleton
        let db2 = new BankDatabase();

        // deep object check
        expect(db).toEqual(db2);

    });


    test('should not pass back the singleton', () => {
        let db = new BankDatabase();
        expect(db.db).toBeDefined();
        expect(db.db.open).toBe(true);
        db['test'] = test;

        // should create a new instance
        let db3 = new BankDatabase(config.database);
        console.log(db3)
        expect(db3.test).toBeUndefined();
        expect(db === db3).toBe(false);

    });

});

// describe('config file', () => {
//     const homedir = os.homedir()

//     const BankDatabase = require('../BankDatabase');

//     test('should be instantiated correctly', () => {
//         db = new BankDatabase()
//         expect(db).toBeDefined();
//         console.log(db.db)
//         expect(db.db).toBeDefined();
//         expect(db.db.open).toBe(true);
//         db.close();
//         expect(db.db.open).toBe(false);
//     });

    
//     // test('basic settings working correctly', () => {
//     //     expect(config['app_name']).toBe("paisley");
//     //     expect(config['app_dir']).toBe(path.join(homedir, "paisley"));
//     // });



// });