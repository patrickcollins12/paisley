const fs = require('fs');
const os = require('os');
const path = require('path');

class ConfigManager {
    constructor(appName, templateConfig) {
        this.appName = appName;
        this.configFilePath = path.join(os.homedir(), `.${appName}`, 'config.json');
        
        // Default template configuration
        this.defaultTemplateConfig = {
            setting1: 'defaultValue1',
            setting2: 'defaultValue2',
            // ... other default settings ...
        };

        // Use provided templateConfig or default
        this.templateConfig = templateConfig || this.defaultTemplateConfig;
    }

    readConfig() {
        if (fs.existsSync(this.configFilePath)) {
            const rawConfig = fs.readFileSync(this.configFilePath);
            let configJson = JSON.parse(rawConfig);
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