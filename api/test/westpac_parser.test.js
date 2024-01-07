const Westpac = require('../csv_parsers/westpac.js');

describe('Westpac Class', () => {
    let westpac;

    beforeEach(() => {
        westpac = new Westpac();
    });

    test('should be instantiated correctly', () => {
        expect(westpac).toBeDefined();
    });

    test('matchesFileName should return correct value', () => {
        const result = westpac.matchesFileName('testfilefwestpac');
        // Assuming the expected return value is a boolean
        expect(result).toBe(true); // or false, depending on your implementation
    });

    test('toUTC should convert date to UTC correctly', () => {
        const result = westpac.toUTC('2003-12-23');
        expect(result).toBe('2003-12-22T13:00:00Z');
    });

    test('toUTC should convert date to UTC correctly', () => {
        const result = westpac.toUTC('2003-12-23T00:00:00-04:00');
        expect(result).toBe('2003-12-23T04:00:00Z');
    });

    test('toUTC should convert date to UTC correctly', () => {
        const result = westpac.toUTC('2003-12-23T00:00:00-00:00');
        expect(result).toBe('2003-12-23T00:00:00Z');
    });

    test('toUTC should convert date to UTC correctly', () => {
        const result = westpac.toUTC('2003-12-23T11:00:00');
        expect(result).toBe('2003-12-23T00:00:00Z');
    });

    test('toUTC should throw an error for invalid timezone', () => {
        westpac.timezone = ""; // this is an invalid scenario that should throw an error
        expect(() => westpac.toUTC('2003-12-23T11:00:00')).toThrow();
    });
   
    test('toUTC should convert date to UTC correctly', () => {
        westpac.timezone = "AEST"
        expect(() => westpac.toUTC('2003-12-23T11:00:00')).toThrow();
    });

    test('toUTC should convert date to UTC correctly', () => {
        westpac.timezone = "AEST"
        expect(() => westpac.toUTC('2003-12-23T11:00:00')).toThrow();
    });


    test('test isalreadyinserted', () => {

        let processedLine = {
            'datetime': "2023-12-01T00:00:00+11:00",
            'description': "This is a test description",
            'account': "12345 67890",
            'debit': 1.00,
            'balance': 50
        }
        const isAlreadyInserted = westpac.isAlreadyInserted(processedLine);
        // console.log(isAlreadyInserted)
       
        expect(isAlreadyInserted).toBe(false); // or false, depending on your implementation
    });


    test('test insertion', () => {

        function deleteRow() {
            let u = "57f245ac1a427f4f12f740f2d0528cce392cd3780ba8d60cbd79fa786001193f";
            let stmt = westpac.db.db.prepare("delete from 'transaction' where id=?")
            stmt.run(u);    
        }

        deleteRow()
        
        let processedLine = {
            'datetime': "2023-12-01T00:00:00+11:00",
            'description': "This is a test description",
            'account': "12345 67890",
            'debit': 1.00,
            'balance': 50
        }
        let orig = { ... processedLine}
        const uniqueId = westpac.saveTransaction(orig, processedLine)

        const isAlreadyInserted = westpac.isAlreadyInserted(processedLine);

        // console.log(isAlreadyInserted)
       
        expect(isAlreadyInserted).toBe(true); // or false, depending on your implementation

        deleteRow()
    });


});