const minimist = require('minimist');
const config = require('../src/Config');
const args = minimist(process.argv.slice(2));
config.load(args.config);
const BankDatabase = require('../src/BankDatabase');

describe('BankDatabase REGEXP function', () => {
    let dbInstance;
    let db;

    beforeAll(() => {
        // Create a new instance of BankDatabase using an in-memory database
        dbInstance = new BankDatabase(':memory:');
        db = dbInstance.db;  // This should correctly reference the database
    });

    afterAll(() => {
        db.close();
    });

    test('REGEXP function matches correctly', () => {
        const setup = db.prepare("CREATE TABLE IF NOT EXISTS test (data TEXT)");
        setup.run();

        const insert = db.prepare("INSERT INTO test (data) VALUES (?)");
        insert.run("hello world");
        insert.run("hello");
        insert.run("world");

        const query = db.prepare("SELECT data FROM test WHERE data REGEXP ?");
        const results = query.all("hello");

        expect(results.length).toBe(2);
        expect(results).toEqual(expect.arrayContaining([{ data: "hello world" }, { data: "hello" }]));
    });

    test('REGEXP function returns 0 for no match', () => {
        const query = db.prepare("SELECT data FROM test WHERE data REGEXP ?");
        const results = query.all("test");

        expect(results.length).toBe(0);
    });
});
