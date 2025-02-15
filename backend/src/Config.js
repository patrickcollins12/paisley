const path = require('path');
const os = require('os');

class Config  {
    constructor() {
        this.loaded = false; // Track if load() has been called
    }

    load(configPath) {
        if (this.loaded) return; // Prevent re-loading

        if (configPath && configPath !== "") {
            this.configFilePath = configPath
        } else {
            this.appName = "paisley";
            this.configFilePath = path.join(os.homedir(), `${this.appName}`, 'config.js');    
        }

        // load the config.js file
        try {
            console.log(`Loading config (${this.configFilePath})`)
            let config = require(this.configFilePath);

            // populate this singleton object with the contents of the config.js file
            Object.assign(this, config);

        } catch (error) {
            console.log(`config file couldn't be loaded: ${this.configFilePath}`,error)
            process.exit(1);
        }

        // TODO allow these to be put back onto config.js. But __dirname is hard to put there
        this.parsers  = path.join(__dirname, "..", "csv_parsers");
        this.scrapers = path.join(__dirname, "..", "scrapers");

        this.loaded = true;
    }

}

const singletonInstance = new Config();
module.exports = singletonInstance;