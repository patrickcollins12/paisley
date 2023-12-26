const path = require('path');
const os = require('os');

class ConfigLoader {
    constructor() {
        this.appName = "pfm";
        this.configFilePath = path.join(os.homedir(), `${this.appName}`, 'config.js');

        // load the config.js file
        let config
        try {
            config = require(this.configFilePath);
        } catch (error) {
            console.log(`config file not found: ${this.configFilePath}`)
            process.exit(1);
        }

        // TODO allow these to be put back onto config.js. But __dirname is hard to put there
        this.parsers  = path.join(__dirname, "csv_parsers");
        this.scrapers = path.join(__dirname, "scrapers");

        // populate this singleton object with the contents of the config.js file
        for (const [key,val] of Object.entries(config) ) {
            if (this[key]) {
                throw new Error("Config loader namespace clash:", key)
            }
            this[key] = val;
        }
    }

}

const singletonInstance = new ConfigLoader();
module.exports = singletonInstance;

// module.exports = ConfigLoader;

