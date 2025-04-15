const BankDatabase = require('../src/BankDatabase.js');
const BalanceHistoryRecreator = require('../src/BalanceHistoryRecreator.js');
const database_setup = require('./BankDatabaseDummy.js');

describe('BalanceHistoryRecreator', () => {
    let db;

    beforeEach(async () => {
        // Setup fresh database for each test
        db = database_setup();  // This already creates all needed tables

        // Insert test account if it doesn't exist
        db.prepare(`
            INSERT OR IGNORE INTO account (accountid, name) VALUES (?, ?)
        `).run('TEST001', 'Test Account');
    });

    afterEach(() => {
        db.close();
    });

    describe('recreateFullAccountHistory', () => {
        test('recreates full account history working backward', async () => {
            // Setup fresh database
            db = database_setup();

            // Insert test account if it doesn't exist
            db.prepare(`
                INSERT OR IGNORE INTO account (accountid, name) VALUES (?, ?)
            `).run('TEST001', 'Test Account');

            // Insert initial balance point with proper data format
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T00:00:00Z', 1000.00, JSON.stringify({ is_manual_balance: true, from: 'manual' }));

            // Insert final balance point with proper data format
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-03T00:00:00Z', 1500.00, JSON.stringify({ is_manual_balance: true, from: 'manual' }));

            // Insert transactions
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('full-1', 'TEST001', '2024-01-01T12:00:00Z', 200.00, 0);
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('full-2', 'TEST001', '2024-01-02T12:00:00Z', 300.00, 0);

            // Mock recordBalance function to actually store the entries
            const recordBalance = jest.fn().mockImplementation(async (accountid, datetime, balance, metadata) => {
                db.prepare(`
                    INSERT INTO account_history (accountid, datetime, balance, data)
                    VALUES (?, ?, ?, ?)
                `).run(accountid, datetime, balance, JSON.stringify(metadata));
                // Return a dummy history id or whatever the real function might return
                return { historyid: Math.floor(Math.random() * 10000), message: 'Balance recorded' }; 
            });

            // Create recreator and run full recreation, passing the mock function
            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-03T00:00:00Z', 1500.00); // manualBalanceDate/manualBalance aren't strictly needed for full history
            await recreator.recreateFullAccountHistory(recordBalance);

            // Verify recreation entries were created
            const recreationEntries = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND json_extract(data, '$.from') = 'recreation'
                ORDER BY datetime ASC
            `).all('TEST001');

            expect(recreationEntries).toHaveLength(2);
            
            // Check first recorded entry (earliest date: 2024-01-01T12:00:00Z)
            // Forward calculation: Start 1000 + tx1 (credit 200) = 1200
            expect(recreationEntries[0].datetime).toBe('2024-01-01T12:00:00Z');
            expect(recreationEntries[0].balance).toBe(1200.00); 
            expect(JSON.parse(recreationEntries[0].data).direction).toBe('forward');
            
            // Check second recorded entry (later date: 2024-01-02T12:00:00Z)
            // Forward calculation: Start 1200 + tx2 (credit 300) = 1500
            expect(recreationEntries[1].datetime).toBe('2024-01-02T12:00:00Z');
            expect(recreationEntries[1].balance).toBe(1500.00);
            expect(JSON.parse(recreationEntries[1].data).direction).toBe('forward');

            // Verify original balance points are preserved
            const originalEntries = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND json_extract(data, '$.from') = 'manual'
                ORDER BY datetime ASC
            `).all('TEST001');

            expect(originalEntries).toHaveLength(2);
            expect(originalEntries[0].balance).toBe(1000.00);
            expect(originalEntries[1].balance).toBe(1500.00);
        });
    });
}); 