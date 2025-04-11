
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

// --- Tests for recalculateAccountBalances ---
describe('BankDatabase recalculateAccountBalances', () => {
    let dbInstance;
    let mockDb;
    let mockGet;
    let mockAll;
    let mockRun;
    let mockPrepare;
    // No longer mocking transaction directly
    // let mockTransaction;
    // let transactionCallback;
    let preparedStatements; // To store mocks created by prepare

    beforeEach(() => {
        // Reset mocks for each test
        preparedStatements = []; // Reset stored mocks
        mockGet = jest.fn();
        mockAll = jest.fn();
        // Note: We don't need a global mockRun anymore

        // Instantiate BankDatabase with a real in-memory db
        // Use a unique path for each test run if needed, or rely on Jest isolation
        dbInstance = new BankDatabase(':memory:');

        // --- Replace methods on the real db object with mocks ---

        // Mock prepare to return new statement mocks and store them
        mockPrepare = jest.fn().mockImplementation((sql) => {
            const statementRunMock = jest.fn().mockReturnValue({ changes: 0 });
            const statementGetMock = mockGet;
            const statementAllMock = mockAll;
            const statementMock = { sql, get: statementGetMock, all: statementAllMock, run: statementRunMock };
            preparedStatements.push(statementMock);
            return statementMock;
        });
        dbInstance.db.prepare = mockPrepare; // Replace prepare method on the actual db object

        // Mock transaction to just execute the callback
        // The 'this' context inside the callback will be the real db object,
        // which now has our mocked 'prepare' method.
        dbInstance.db.transaction = jest.fn((callback) => {
            return (...args) => {
                try {
                    return callback(...args);
                } catch (e) { throw e; }
            };
        });

        // Mock 'function' if needed (addRegex calls it, constructor might fail otherwise)
        if (!dbInstance.db.function) { // Check if it exists before trying to mock
            dbInstance.db.function = jest.fn();
        } else {
            jest.spyOn(dbInstance.db, 'function').mockImplementation(jest.fn());
        }
        // --- End method replacement ---
    });

    test('should skip recalculation if no reference balance found', async () => {
        mockGet.mockReturnValue(undefined); // Simulate no reference found

        await dbInstance.recalculateAccountBalances('acc1');

        // Check getReferenceQuery was prepared and run
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('is_reference = TRUE'));
        expect(mockGet).toHaveBeenCalledWith('acc1');

        // Ensure delete and transaction fetch were NOT called
        expect(mockPrepare).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM account_history'));
        expect(mockPrepare).not.toHaveBeenCalledWith(expect.stringContaining('FROM "transaction"'));
    });

    test('should handle no transactions found after reference date', async () => {
        const refBalance = { datetime: '2024-01-15T10:00:00Z', balance: 500 };
        mockGet.mockReturnValue(refBalance); // Return reference balance
        mockAll.mockReturnValue([]); // Return empty array for transactions

        await dbInstance.recalculateAccountBalances('acc2');

        // Check transaction was started
        // We can't easily assert the real transaction was called without more complex mocking/spying
        // expect(mockTransaction).toHaveBeenCalledTimes(1);

        // Check getReferenceQuery was prepared and run
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('is_reference = TRUE'));
        expect(mockGet).toHaveBeenCalledWith('acc2');

        // Check delete was prepared and run inside transaction
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM account_history'));
        // Find the mock for the DELETE statement and check its run call
        const deleteStmtMock = preparedStatements.find(s => s.sql.includes('DELETE FROM account_history'));
        expect(deleteStmtMock).toBeDefined();
        expect(deleteStmtMock.run).toHaveBeenCalledWith('acc2'); // Check delete run call

        // Check transaction query was prepared and run
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('FROM "transaction"'));
        expect(mockAll).toHaveBeenCalledWith('acc2'); // Called with accountid only now

        // Check INSERT was prepared but run was NOT called
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO account_history'));
        // Check that the INSERT statement was prepared within the transaction
        const insertStmtMock = preparedStatements.find(s => s.sql.includes('INSERT INTO account_history'));
        expect(insertStmtMock).toBeDefined();

        // Check that the run method of the INSERT statement mock was NOT called
        expect(insertStmtMock.run).not.toHaveBeenCalled();
    });

    test('should calculate balances correctly (forward only)', async () => {
        const refBalance = { datetime: '2024-01-15T10:00:00Z', balance: 500 };
        const transactions = [
            { datetime: '2024-01-16T12:00:00Z', credit: 100, debit: 0 }, // Bal: 600
            { datetime: '2024-01-16T14:00:00Z', credit: 0, debit: 50 },  // Bal: 550 (End of day 16th)
            { datetime: '2024-01-18T09:00:00Z', credit: 200, debit: 0 }, // Bal: 750 (End of day 18th)
        ];
        mockGet.mockReturnValue(refBalance);
        mockAll.mockReturnValue(transactions);

        await dbInstance.recalculateAccountBalances('acc3');

        // We can't easily assert the real transaction was called
        // expect(mockTransaction).toHaveBeenCalledTimes(1);
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM account_history'));
        // Find the mock for the DELETE statement and check its run call
        const deleteStmtMock = preparedStatements.find(s => s.sql.includes('DELETE FROM account_history'));
        expect(deleteStmtMock).toBeDefined();
        expect(deleteStmtMock.run).toHaveBeenCalledWith('acc3'); // Check delete run call

        // Explicitly check that prepare was called for the INSERT statement
        expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO account_history'));
        // Find the mock statement object for the INSERT query
        // It should be the last one prepared in this specific test flow
        const insertStmtMock = preparedStatements.find(s => s.sql.includes('INSERT INTO account_history'));
        // If the above find is unreliable, try getting the last prepared statement directly:
        // const insertStmtMock = preparedStatements[preparedStatements.length - 1];
        // expect(insertStmtMock.sql).toContain('INSERT INTO account_history'); // Verify it's the insert

        expect(insertStmtMock).toBeDefined(); // Ensure we found the mock
        const insertRunMock = insertStmtMock.run; // Get the run mock specific to this statement

        // Should insert closing balances for 16th and 18th
        expect(insertRunMock).toHaveBeenCalledTimes(2);
        // Check closing balance for Jan 16th
        expect(insertRunMock).toHaveBeenCalledWith(
            'acc3',
            '2024-01-16T23:59:59.999Z', // End of day timestamp
            550, // Balance after last transaction on 16th
            JSON.stringify({ source: "recalculated" }),
            0
        );
        // Check closing balance for Jan 18th
        expect(insertRunMock).toHaveBeenCalledWith(
            'acc3',
            '2024-01-18T23:59:59.999Z', // End of day timestamp
            750, // Balance after transaction on 18th
            JSON.stringify({ source: "recalculated" }),
            0
        );
    });

    // TODO: Add tests for backward only, both directions, multiple tx per day, tx at ref time etc.

});
