const BankDatabase = require('../src/BankDatabase');
const AccountHistory = require('../src/AccountHistory');
const database_setup = require('./BankDatabaseDummy.js');

describe('AccountHistory', () => {
    let db;

    beforeEach(async () => {
        // Setup fresh database for each test
        db = database_setup();

        // Drop existing tables if they exist
        db.exec(`
            DROP TABLE IF EXISTS account_history;
            DROP TABLE IF EXISTS account;
        `);

        // Create required tables with correct schema
        db.exec(`
            CREATE TABLE IF NOT EXISTS account (
                accountid TEXT PRIMARY KEY,
                name TEXT,
                parentid TEXT
            );

            CREATE TABLE IF NOT EXISTS account_history (
                historyid INTEGER PRIMARY KEY AUTOINCREMENT,
                accountid TEXT NOT NULL,
                datetime TEXT,
                balance REAL,
                data JSON,
                FOREIGN KEY(accountid) REFERENCES account(accountid) ON DELETE CASCADE
            );
        `);

        // Insert test account
        db.prepare(`
            INSERT INTO account (accountid, name, parentid) VALUES (?, ?, ?)
        `).run('TEST001', 'Test Account', null);
    });

    afterEach(() => {
        db.close();
    });

    test('records balance correctly', async () => {
        const result = await AccountHistory.recordBalance('TEST001', '2024-01-01T00:00:00Z', 1000.00);
        expect(result.historyid).toBeDefined();
        expect(result.message).toBe('Balance recorded');

        const history = db.prepare(`
            SELECT * FROM account_history WHERE accountid = ?
        `).get('TEST001');

        expect(history).toBeDefined();
        expect(history.balance).toBe(1000.00);
        expect(history.datetime).toBe('2024-01-01T00:00:00Z');
    });

    test('handles non-existent account', async () => {
        await expect(AccountHistory.recordBalance('NONEXISTENT', '2024-01-01T00:00:00Z', 1000.00))
            .rejects.toThrow("Account ID 'NONEXISTENT' does not exist.");
    });

    test('gets account history correctly', async () => {
        // Insert some test data
        await AccountHistory.recordBalance('TEST001', '2024-01-01T00:00:00Z', 1000.00);
        await AccountHistory.recordBalance('TEST001', '2024-01-02T00:00:00Z', 1500.00);

        const history = await AccountHistory.getAccountHistory('TEST001', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');
        expect(history).toHaveLength(2);
        expect(history[0].balance).toBe(1000.00);
        expect(history[1].balance).toBe(1500.00);
    });

    test('gets interest changes correctly', async () => {
        // Insert test data with interest information
        await AccountHistory.recordBalance('TEST001', '2024-01-01T00:00:00Z', 1000.00, { interest: 0.05 });
        await AccountHistory.recordBalance('TEST001', '2024-01-02T00:00:00Z', 1500.00, { interest: 0.06 });

        const changes = await AccountHistory.getInterestChanges('TEST001', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');
        
        // Filter out duplicates by historyid
        const uniqueChanges = changes.filter((change, index, self) =>
            index === self.findIndex((c) => c.historyid === change.historyid)
        );
        
        expect(uniqueChanges).toHaveLength(2);
        expect(uniqueChanges[0].interest).toBe(0.06);
        expect(uniqueChanges[1].interest).toBe(0.05);
    });
}); 