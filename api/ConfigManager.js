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
            let configJson = JSON.parse(rawConfig);
            // console.log("Read config:", configJson)
            return configJson;
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
}


module.exports = ConfigManager;