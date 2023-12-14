const fs = require('fs');
const os = require('os');
const path = require('path');

class ConfigManager {
    constructor(appName, templateConfig) {
        this.appName = appName;
        this.configFilePath = path.join(os.homedir(), `.${appName}`, 'config.json');
        
        // Default template configuration
        this.defaultTemplateConfig = {
            csv_watch: "$HOME/Downloads/bank_statements",
            csv_processed: "$HOME/Downloads/bank_statements/processed",
            database: "$HOME/.pfm/transactions.db"
          }
          
        // Use provided templateConfig or default
        this.templateConfig = templateConfig || this.defaultTemplateConfig;
    }

    readConfig() {
        if (fs.existsSync(this.configFilePath)) {
            let rawConfig = fs.readFileSync(this.configFilePath,'utf8');
            rawConfig = rawConfig.replace(/\$HOME/g,os.homedir())
            let c = JSON.parse(rawConfig);
            
            // turn this: 
            //    "fileNameAccountMatch": "/Chase(\\d+)\\b/",
            // into this:
            //    "fileNameAccountMatch": /Chase(\d+)\b/
            for (const parser of c['parsers']) {
                var fnam = parser.fileNameAccountMatch
                if ( fnam ) {
                    parser.fileNameAccountMatch = this.toRegexIfApplicable(fnam);
                }
            }
            return c;
        } else {
            // Use the template config if the file doesn't exist
            this.writeConfig(this.templateConfig);
            return this.templateConfig;
        }
    }

    writeConfig(config) {
        const dir = path.dirname(this.configFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2) + "\n");
    }

    toRegexIfApplicable(str) {
        const regexPattern = /^\/(.*?)\/([gimsuy]*)$/;
        const match = str.match(regexPattern);
    
        if (match) {
            try {
                // match[1] contains the regex pattern, match[2] contains the flags
                return new RegExp(match[1], match[2]);
            } catch (error) {
                console.error("Invalid regular expression:", error.message);
                // Optionally handle the error, e.g., by returning the original string or null
                return null;
            }
        } else {
            // Return the string as is if it doesn't match the regex pattern
            return str;
        }
    }
}


module.exports = ConfigManager;