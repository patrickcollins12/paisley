const CSVParserFactory = require('../CSVParserFactory');
const fs = require('fs');

jest.mock('fs');

describe('CSVParserFactory', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.resetAllMocks();

        // Mock fs.readdirSync to simulate different parser files
        fs.readdirSync.mockReturnValue(['Type1CSVParser.js', 'Type2CSVParser.js']);

        // Mock the parsers
        jest.mock('./parsers/Type1CSVParser', () => {
            return function() {
                return {
                    identifier: 'type1',
                    matchesFileName: (fileName) => fileName.includes('type1'),
                    matchesFirstLine: (line) => line.includes('Type 1 Data'),
                    parse: jest.fn()
                };
            };
        }, { virtual: true });

        jest.mock('./parsers/Type2CSVParser', () => {
            return function() {
                return {
                    identifier: 'type2',
                    matchesFileName: (fileName) => fileName.includes('type2'),
                    matchesFirstLine: (line) => line.includes('Type 2 Data'),
                    parse: jest.fn()
                };
            };
        }, { virtual: true });
    });

    test('should correctly select parser based on file name', async () => {
        const parserFactory = new CSVParserFactory();
        const parser = await parserFactory.getParser('file_type1.csv');
        expect(parser.identifier).toBe('type1');
    });

    test('should correctly select parser based on first data line', async () => {
        // Mock file reading
        const mockStream = require('stream');
        const mockReadline = require('readline');
        jest.spyOn(mockStream, 'createReadStream').mockReturnValueOnce(new mockStream.Readable());
        jest.spyOn(mockReadline, 'createInterface').mockReturnValueOnce({
            on: (event, callback) => {
                if (event === 'line') {
                    callback('Type 1 Data'); // Simulate first data line
                }
                return { close: jest.fn() };
            }
        });

        const parserFactory = new CSVParserFactory();
        const parser = await parserFactory.getParser('unknown_format.csv');
        expect(parser.identifier).toBe('type1');
    });

    // ... more tests as needed ...
});
