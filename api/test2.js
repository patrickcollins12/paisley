const CSVParserFactory = require('./CSVParserFactory'); // Adjust the path according to your file structure

async function processFile(filePath) {
    try {
        const file2 = "/Users/patrick/Downloads/bank_statements/westpacData_export_03122023.csv"

        const csvpf = new CSVParserFactory()
    
        const parser = await csvpf.getParser(file2);
        console.log(parser)
        records = await parser.parse(file2)
        console.log(records)
        // await DataHandler.saveData(records);
    } catch (error) {
        console.error("Error processing file:", error);
    }
}

processFile("test.csv")
