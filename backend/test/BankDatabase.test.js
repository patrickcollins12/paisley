
const BankDatabase = require('../src/BankDatabase');
const database_setup = require('./BankDatabaseDummy.js');
describe('BankDatabase REGEXP function', () => {
    let dbInstance;
    let db;

    beforeAll(() => {
        // Create a new instance of BankDatabase using an in-memory database
        dbInstance = new BankDatabase(':memory:');
        db = database_setup()

        const setup = db.prepare("CREATE TABLE IF NOT EXISTS test (data TEXT)");
        setup.run();

        const insert = db.prepare("INSERT INTO test (data) VALUES (?)");
        insert.run("hello world");
        insert.run("hello");
        insert.run("World");

    });

    afterAll(() => {
        db.close();
    });

    function dbregex(regex) {
        const query = db.prepare("SELECT data FROM test WHERE data REGEXP ?");
        return query.all(regex);
    }

    test('REGEXP function matches basic 1', () => {
        const results = dbregex("hello")
        expect(results.length).toBe(2);
        expect(results).toEqual(expect.arrayContaining([{ data: "hello world" }, { data: "hello" }]));
    });

    test('REGEXP function matches basic 2', () => {
        expect(() => {
            const results = dbregex("/World/gihjk")
          }).toThrow();
        
    });

    test('REGEXP function matches basic 3', () => {
        const results = dbregex("World")
        expect(results.length).toBe(1);
    });


    test('REGEXP function matches basic 4', () => {
        const results = dbregex("world/i")
        expect(results.length).toBe(2);
    });

    test('REGEXP function matches basic 5', () => {
        const results = dbregex("/world/i")
        expect(results.length).toBe(2);
    });

    test('REGEXP function matches basic 6', () => {
        const results = dbregex("/World/")
        expect(results.length).toBe(1);
    });

    test('REGEXP function returns 0 for no match', () => {
        const query = db.prepare("SELECT data FROM test WHERE data REGEXP ?");
        const results = query.all("test");

        expect(results.length).toBe(0);
    });

    test('REGEXP function returns 0 for no match', () => {
        let db = database_setup()
    });
});
