const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const config = require('./Config');

class CSVParserFactory {
    // constructor(config, db) {
    //     this.parsers = {};
    //     this.bankdb = db;
    // }

    constructor() {
        this.parsers = {};
    }

    // call this immediately after creating the object.
    // await csvParserFactory.loadParsers()
    async loadParsers() {
        try {
            let parserDir = config.parsers;
            if (parserDir.startsWith("./")) {
                // console.log(`${parserDir} starts with ./`)
                parserDir = path.join(__dirname, parserDir)
            }
            const files = await fs.readdir(parserDir);
            await Promise.all(files.map(async (file) => {
                let dirFile = path.join(parserDir, file)
                if (!file.endsWith('.js')) throw new Error(`Parser class must end in js: ${dirFile}`);
                const Parser = require(dirFile);
                this.parsers[Parser.name] = Parser;

                try {
                    Parser.config = config[Parser.name];
                } catch { }

                console.log(`Loaded parser: ${file}`);
                // await processFile(filePath); // Replace this with actual processing logic
            }));
            return true;
        } catch (error) {
            console.error('Error processing classes:', error);
            throw error;
        }
    }

    // moving this logic back up into the caller
    // async processCSVFile(file) {
    //     const parser = await this.chooseParser(file);
    //     if (parser) {
    //         //   var accountid = parser.extractAccountFromFileName(filePath);
    //         //   var accountid = parser.extractAccountFromFileName(filePath);
    //         console.log(`Using ${parser.identifier} parser for file ${file}`);
    //         //   parser.setDB(bankdb);
    //         parser.bankdb = this.bankdb;
    //         parser.fileName = file;
    //         await parser.parse(file)
    //         return true;
    //     }
    //     else {
    //         console.log(`Couldn't find parser for file ${file}`);
    //         return false;
    //     }
    // }

    async chooseParser(file) {
        const fileName = path.basename(file);
        let selectedParser = false;
        let parser = null;

        // loop through each Parser to find one to use
        for (const [parserName, Parser] of Object.entries(this.parsers)) {
            if (selectedParser) break;

            // var cfg = config[Parser.name]
            parser = new Parser(file);

            ////////////
            // First, try to select parser based on config entries
            // "ChaseCSVParser": {
            //     "accountExpands": {
            //         "Chase0378": "322271627 3162960378",
            //         "Chase7316": "322271627 5656297316"
            //     }
            // },
            // if (!selectedParser) {
            //     try {
            //         for (const [pattern, accountid] of Object.entries(cfg.accountExpands)) {
            //             if (fileName.includes(pattern)) {
            //                 console.log(`setting accountid: ${accountid}`)
            //                 console.log(`${parserName} for ${fileName} with accountid ${accountid}`)
            //                 selectedParser = true;
            //                 parser.accountid = accountid
            //                 break;
            //                 // return true
            //             }
            //         }
            //     } catch { }
            // }

            ////////////
            // Second, try to select parser based on file name
            // static matchesFileName(fileName) {
            //     // Logic to determine if this parser should handle the file based on the file name
            //     return fileName.toLowerCase().includes('chase');
            // }
            if (!selectedParser) {
                if (parser.matchesFileName(fileName)) {
                    console.log(`${parserName} for ${fileName} with accountid ${parser.accountid}`)
                    selectedParser = true;
                    // extractAccountFromFileName
                    break;
                }
            }

            ////////////
            // Third, if no parser found by file name, try finding the parser by reading the first line
            if (!selectedParser) {
                if (await parser.extractAccountBySecondLine()) {
                    selectedParser = true
                    break;
                }
            }

        }
        if (selectedParser){
            return parser;
        } else {
            throw Error(`Couldn't find parser for ${file}`)
        }
    }

}

module.exports = CSVParserFactory;
