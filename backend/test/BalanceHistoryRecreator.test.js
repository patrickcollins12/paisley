const BankDatabase = require('../src/BankDatabase');
const BalanceHistoryRecreator = require('../src/BalanceHistoryRecreator');
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

    describe('findNearestBalancePoint', () => {
        test('finds previous balance point', async () => {
            // Insert a balance point before our reference date
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T00:00:00Z', 1000.00, '{}');

            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-02T00:00:00Z', 1500.00);
            const result = await recreator.findNearestBalancePoint('2024-01-02T00:00:00Z', false);

            expect(result).toBeDefined();
            expect(result.datetime).toBe('2024-01-01T00:00:00Z');
            expect(result.balance).toBe(1000.00);
        });

        test('finds next balance point', async () => {
            // Insert a balance point after our reference date
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-03T00:00:00Z', 2000.00, '{}');

            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-02T00:00:00Z', 1500.00);
            const result = await recreator.findNearestBalancePoint('2024-01-02T00:00:00Z', true);

            expect(result).toBeDefined();
            expect(result.datetime).toBe('2024-01-03T00:00:00Z');
            expect(result.balance).toBe(2000.00);
        });

        test('returns null when no balance points exist', async () => {
            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-02T00:00:00Z', 1500.00);
            const result = await recreator.findNearestBalancePoint('2024-01-02T00:00:00Z', false);

            expect(result).toBeNull();
        });
    });

    describe('getTransactions', () => {
        test('retrieves transaction within date range', async () => {
            // Insert test transactions
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('get-tx-1', 'TEST001', '2024-01-01T12:00:00Z', 100.00, 0);
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('get-tx-2', 'TEST001', '2024-01-02T12:00:00Z', 0, 50.00);

            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-03T00:00:00Z', 1500.00);
            const transaction = await recreator.getTransactions('2024-01-01T00:00:00Z', '2024-01-03T00:00:00Z');

            expect(transaction).toHaveLength(2);
            expect(transaction[0].credit).toBe(100.00);
            expect(transaction[1].debit).toBe(50.00);
        });
    });

    describe('processTransaction', () => {
        test('correctly processes credit transaction', () => {
            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-01T00:00:00Z', 1000.00);
            const newBalance = recreator.processTransaction(1000.00, { credit: 100.00, debit: 0 });

            expect(newBalance).toBe(1100.00);
        });

        test('correctly processes debit transaction', () => {
            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-01T00:00:00Z', 1000.00);
            const newBalance = recreator.processTransaction(1000.00, { credit: 0, debit: 100.00 });

            expect(newBalance).toBe(900.00);
        });
    });

    describe('recreateHistory', () => {
        test('recreates history between balance points', async () => {
            // Insert initial balance point
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T00:00:00Z', 1000.00, '{}');

            // Insert transactions
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('recreate-tx-1', 'TEST001', '2024-01-01T12:00:00Z', 100.00, 0);
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('recreate-tx-2', 'TEST001', '2024-01-02T12:00:00Z', 0, 50.00);

            // Mock recordBalance function to actually store the entries
            const recordBalance = jest.fn().mockImplementation((accountid, datetime, balance, metadata) => {
                db.prepare(`
                    INSERT INTO account_history (accountid, datetime, balance, data)
                    VALUES (?, ?, ?, ?)
                `).run(accountid, datetime, balance, JSON.stringify(metadata));
                return { historyid: 1, message: 'Balance recorded' };
            });

            await BalanceHistoryRecreator.recreateHistory(
                'TEST001',
                '2024-01-03T00:00:00Z',
                1050.00,
                recordBalance
            );

            // Verify the entries were created
            const entries = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND json_extract(data, '$.from') = 'recreation'
                ORDER BY datetime ASC
            `).all('TEST001');

            expect(entries).toHaveLength(3);
            
            // Check the first transaction balance
            expect(entries[0].balance).toBe(1100.00);
            expect(JSON.parse(entries[0].data).direction).toBe('forward');
            
            // Check the second transaction balance
            expect(entries[1].balance).toBe(1050.00);
            expect(JSON.parse(entries[1].data).direction).toBe('forward');
            
            // Check the final balance
            expect(entries[2].balance).toBe(1050.00);
            expect(JSON.parse(entries[2].data).is_manual_balance).toBe(true);
        });

        test('deletes old recreation entries before creating new ones', async () => {
            // Insert initial balance point
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T00:00:00Z', 1000.00, '{}');

            // Insert some old recreation entries
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T12:00:00Z', 1100.00, JSON.stringify({ from: 'recreation' }));
            db.prepare(`
                INSERT INTO account_history (accountid, datetime, balance, data)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-02T00:00:00Z', 1200.00, JSON.stringify({ from: 'recreation' }));

            // Verify old recreation entries exist before deletion
            const initialRecreationEntries = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND json_extract(data, '$.from') = 'recreation'
                ORDER BY datetime ASC
            `).all('TEST001');

            expect(initialRecreationEntries).toHaveLength(2);
            expect(initialRecreationEntries[0].datetime).toBe('2024-01-01T12:00:00Z');
            expect(initialRecreationEntries[0].balance).toBe(1100.00);
            expect(JSON.parse(initialRecreationEntries[0].data).from).toBe('recreation');
            expect(initialRecreationEntries[1].datetime).toBe('2024-01-02T00:00:00Z');
            expect(initialRecreationEntries[1].balance).toBe(1200.00);
            expect(JSON.parse(initialRecreationEntries[1].data).from).toBe('recreation');

            // Also verify the initial balance point exists
            const initialBalancePoint = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND datetime = ?
            `).get('TEST001', '2024-01-01T00:00:00Z');

            expect(initialBalancePoint).toBeDefined();
            expect(initialBalancePoint.balance).toBe(1000.00);

            // Insert transactions
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('delete-tx-1', 'TEST001', '2024-01-01T12:00:00Z', 100.00, 0);
            db.prepare(`
                INSERT INTO "transaction" (id, account, datetime, credit, debit)
                VALUES (?, ?, ?, ?, ?)
            `).run('delete-tx-2', 'TEST001', '2024-01-02T12:00:00Z', 0, 50.00);

            // Mock recordBalance function to actually store the entries
            const recordBalance = jest.fn().mockImplementation((accountid, datetime, balance, metadata) => {
                db.prepare(`
                    INSERT INTO account_history (accountid, datetime, balance, data)
                    VALUES (?, ?, ?, ?)
                `).run(accountid, datetime, balance, JSON.stringify(metadata));
                return { historyid: 1, message: 'Balance recorded' };
            });

            // Run recreation
            await BalanceHistoryRecreator.recreateHistory(
                'TEST001',
                '2024-01-03T00:00:00Z',
                1050.00,
                recordBalance
            );
            
            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-03T00:00:00Z', 1050.00);
            await recreator.deleteOldRecreationEntries("2024-01-01T00:00:00Z", "2024-01-03T00:00:00Z");
        
            // Verify old recreation entries were deleted
            const remainingRecreationEntries = db.prepare(`
                SELECT * FROM account_history 
                WHERE accountid = ? 
                AND datetime >= ? 
                AND datetime <= ?
                AND json_extract(data, '$.from') = 'recreation'
            `).all('TEST001', '2024-01-01T00:00:00Z', '2024-01-03T00:00:00Z');
            expect(remainingRecreationEntries).toHaveLength(0);
        });
    });

}); 