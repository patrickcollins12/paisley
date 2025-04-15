const BankDatabase = require('../src/BankDatabase');
const AccountHistory = require('../src/AccountHistory');
const database_setup = require('./BankDatabaseDummy.js');

describe('AccountHistory', () => {
    let db;

    beforeEach(async () => {
        // Setup fresh database for each test using the dummy setup
        db = database_setup(); 

        // Clear relevant tables before each test, instead of dropping/recreating
        // This ensures we use the schema from BankDatabaseDummy.js
        try {
            db.exec(`
                DELETE FROM account_history;
                DELETE FROM "transaction";
                DELETE FROM account;
            `);
            
            // Insert the base test account needed for most tests
            db.prepare(`
                INSERT INTO account (accountid, name, currency, type, parentid) VALUES (?, ?, ?, ?, ?)
            `).run('TEST001', 'Test Account', 'USD', 'Checking', null);
            
        } catch (error) {
            console.error("Error cleaning/setting up test DB:", error);
            // If setup fails, close DB and rethrow to fail tests clearly
            db.close(); 
            throw error;
        }
    });

    afterEach(() => {
        if (db && db.open) { // Check if DB is open before closing
             db.close();
        }
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
        // Mock data setup - Insert only history/transaction data 
        // Account TEST001 should already exist from beforeEach
        await db.exec(`
            INSERT INTO account_history (accountid, datetime, balance) VALUES ('TEST001', '2024-01-01T00:00:00Z', 1000.00);
            -- Provide a unique ID for the transaction
            INSERT INTO "transaction" (id, account, datetime, balance) VALUES ('TXN_HIST_TEST_1', 'TEST001', '2024-01-02T00:00:00Z', 1500.00);
        `);

        // Call the function being tested
        const history = await AccountHistory.getAccountHistory('TEST001', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');

        // Assertions (already updated in previous step)
        expect(history).toHaveLength(1); 
        expect(history[0]).toHaveProperty('accountid', 'TEST001');
        expect(history[0]).toHaveProperty('series');
        expect(history[0].series).toBeInstanceOf(Array);
        expect(history[0].series).toHaveLength(2); 
        expect(history[0].series[0][0]).toBe('2024-01-01T00:00:00Z');
        expect(history[0].series[0][1]).toBe(1000.00);
        expect(history[0].series[1][0]).toBe('2024-01-02T00:00:00Z');
        expect(history[0].series[1][1]).toBe(1500.00);
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