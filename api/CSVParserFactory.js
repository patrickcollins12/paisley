// const fs = require('fs');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
// const { createReadStream } = require('fs');

class CSVParserFactory {
    constructor(config,db) {
        this.parsers = {};
        this.config = config;
        this.bankdb = db;
    }

    async loadParsers() {
        try {
            let parserDir = this.config.parsers;
            if (parserDir.startsWith("./")) {
                // console.log(`${parserDir} starts with ./`)
                parserDir = path.join(__dirname, parserDir)
            }
            const files = await fs.readdir(parserDir);
            await Promise.all(files.map(async (file) => {
                let dirFile = path.join(parserDir, file)
                if (! file.endsWith('.js')) throw new Error(`Parser class must end in js: ${dirFile}`);
                const Parser = require(dirFile);
                this.parsers[Parser.name] = Parser;

                try {
                    Parser.config = this.config[ Parser.name ];                  
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
    
    async processCSVFile(file) {
        const parser = await this.chooseParser(file);
        if (parser) {
            //   var accountid = parser.extractAccountFromFileName(filePath);
            //   var accountid = parser.extractAccountFromFileName(filePath);
          console.log(`Using ${parser.identifier} parser for file ${file}`);
        //   parser.setDB(bankdb);
          parser.bankdb = this.bankdb;
          parser.fileName = file;
          await parser.parse(file)  
        }
        else {
          console.log(`Couldn't find parser for file ${file}`);
        }
      }
      
    async chooseParser(file) {
        const fileName = path.basename(file);
        let selectedParser = false;
        let parser = null;

        // loop through each Parser to find one to use
        for (const [parserName, Parser] of Object.entries(this.parsers)) {
            if (selectedParser) break;

            var cfg = this.config[ Parser.name ]
            let options = {
                'fileName':file, 
                'config':cfg, 
                'bankdb':this.bankdb
            }
            parser = new Parser(options);

            ////////////
            // First, try to select parser based on config entries
            // "ChaseCSVParser": {
            //     "accountExpands": {
            //         "Chase0378": "322271627 3162960378",
            //         "Chase7316": "322271627 5656297316"
            //     }
            // },
            if (!selectedParser) {
                try {
                    for (const [pattern, accountid] of Object.entries(cfg.accountExpands)) {
                        if (fileName.includes(pattern)) {
                            // console.log(`setting accountid: ${accountid}`)
                            console.log(`${parserName} for ${fileName} with accountid ${accountid}`)
                            selectedParser = true;
                            parser.accountid = accountid
                            break;
                            // return true
                        }
                    }    
                } catch {}
            }

            ////////////
            // Second, try to select parser based on file name
            // static matchesFileName(fileName) {
            //     // Logic to determine if this parser should handle the file based on the file name
            //     return fileName.toLowerCase().includes('chase');
            // }
            if (!selectedParser) {
                if (parser.matchesFileName(fileName)) {
                    selectedParser = true;
                    // extractAccountFromFileName
                    break;
                }
            }

            ////////////
            // Third, if no parser found by file name, try finding the parser by reading the first line
            if (!selectedParser) {
                let accountid = await parser.extractAccountBySecondLine();
                
                if (accountid) {
                    selectedParser = true
                    break;
                }
            }


        }

        return parser;    
        
    }

}

module.exports = CSVParserFactory;
