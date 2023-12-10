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
});