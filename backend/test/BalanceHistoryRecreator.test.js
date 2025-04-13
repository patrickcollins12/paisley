const BankDatabase = require('../src/BankDatabase');
const BalanceHistoryRecreator = require('../src/BalanceHistoryRecreator');
const database_setup = require('./BankDatabaseDummy.js');

describe('BalanceHistoryRecreator', () => {
    let db;

    beforeEach(async () => {
        // Setup fresh database for each test
        db = database_setup();

        // Drop existing tables if they exist
        db.exec(`
            DROP TABLE IF EXISTS account_history;
            DROP TABLE IF EXISTS transactions;
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

            CREATE TABLE IF NOT EXISTS transactions (
                transactionid INTEGER PRIMARY KEY AUTOINCREMENT,
                accountid TEXT NOT NULL,
                datetime TEXT,
                credit REAL,
                debit REAL,
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
        test('retrieves transactions within date range', async () => {
            // Insert test transactions
            db.prepare(`
                INSERT INTO transactions (accountid, datetime, credit, debit)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T12:00:00Z', 100.00, 0);
            db.prepare(`
                INSERT INTO transactions (accountid, datetime, credit, debit)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-02T12:00:00Z', 0, 50.00);

            const recreator = new BalanceHistoryRecreator('TEST001', '2024-01-03T00:00:00Z', 1500.00);
            const transactions = await recreator.getTransactions('2024-01-01T00:00:00Z', '2024-01-03T00:00:00Z');

            expect(transactions).toHaveLength(2);
            expect(transactions[0].credit).toBe(100.00);
            expect(transactions[1].debit).toBe(50.00);
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
                INSERT INTO transactions (accountid, datetime, credit, debit)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-01T12:00:00Z', 100.00, 0);
            db.prepare(`
                INSERT INTO transactions (accountid, datetime, credit, debit)
                VALUES (?, ?, ?, ?)
            `).run('TEST001', '2024-01-02T12:00:00Z', 0, 50.00);

            // Mock recordBalance function
            const recordBalance = jest.fn().mockResolvedValue({ historyid: 1, message: 'Balance recorded' });

            await BalanceHistoryRecreator.recreateHistory(
                'TEST001',
                '2024-01-03T00:00:00Z',
                1050.00,
                recordBalance
            );

            // Should have called recordBalance for each transaction and the final balance
            expect(recordBalance).toHaveBeenCalledTimes(3);
            
            // Check the first transaction balance
            expect(recordBalance).toHaveBeenCalledWith(
                'TEST001',
                '2024-01-01T12:00:00Z',
                1100.00,
                expect.any(Object)
            );
            
            // Check the second transaction balance
            expect(recordBalance).toHaveBeenCalledWith(
                'TEST001',
                '2024-01-02T12:00:00Z',
                1050.00,
                expect.any(Object)
            );
        });
    });
}); 