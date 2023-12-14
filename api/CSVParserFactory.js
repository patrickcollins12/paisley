const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createReadStream } = require('fs');

class CSVParserFactory {
    constructor() {
        this.parsers = {};
        this.loadParsers();
    }

    loadParsers() {
        const parsersPath = path.join(__dirname, 'csv_parsers'); // Adjust 'parsers' to your directory name
        fs.readdirSync(parsersPath).forEach(file => {
            if (file.endsWith('.js')) {
                const Parser = require(path.join(parsersPath, file));
                const instance = new Parser();
                if (instance.identifier) {
                    this.parsers[instance.identifier] = instance;
                }
            }
        });
    }

    async processCSVFile(filePath) {
        const parser = await this.getParser(filePath);
        if (parser) {
          console.log(`Using ${parser.identifier} parser for file ${filePath}`);
          parser.setDB(bankdb);
          parser.parse(filePath)  
        }
        else {
          console.log(`Couldn't find parser for file ${filePath}`);
        }
      }
      
    async getParser(filePath) {
        const fileName = path.basename(filePath);
        let selectedParser = null;

        // First, try to select parser based on file name
        for (let key in this.parsers) {
            if (this.parsers[key].matchesFileName(fileName)) {
                selectedParser = this.parsers[key];
                break;
            }
        }

        // If no parser found by file name, read the first line
        if (!selectedParser) {
            selectedParser = await this.selectParserBySecondLine(filePath);
        }

        return selectedParser;
    }

    async selectParserBySecondLine(filePath) {
        return new Promise((resolve, reject) => {
            const rl = readline.createInterface({
                input: createReadStream(filePath),
                crlfDelay: Infinity
            });

            let lineCount = 0;
            rl.on('line', (line) => {
                lineCount++;
                if (lineCount === 1) return; // Skip the first line

                if (lineCount === 2) {
                    for (let key in this.parsers) {
                        if (this.parsers[key].matchesSecondLine(line)) {
                            resolve(this.parsers[key]);
                            rl.close();
                            return;
                        }
                    }
                    // reject(new Error("No parser matches the second line"));
                    resolve(null);
                    rl.close();
                }
            }).on('close', () => {
                if (lineCount<2) {
                    // If the second line was not processed, it means the file has only one line
                    resolve(null);
                }
            }).on('error', reject);
        });
    }
}

module.exports = CSVParserFactory;
