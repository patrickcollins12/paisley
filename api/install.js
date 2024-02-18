const fs = require('fs');
const os = require('os');
const path = require('path');
const hd = os.homedir()

const sourceDir = path.join(__dirname, 'demo');
const demoPath = path.join(hd, 'paisley/demo');
const csvPath = path.join(hd, 'paisley/demo/bank_statements/processed');

try {
    console.log("Installing demo data ... ")

    // Ensure the demo directory exists
    fs.mkdirSync(demoPath, { recursive: true });
    fs.mkdirSync(csvPath, { recursive: true });

    fs.readdirSync(sourceDir)
    .filter(file => file.startsWith('demo_'))
    .forEach(file => fs.copyFileSync(path.join(sourceDir, file), path.join(demoPath, file)));

    console.log("... done\n\n")

    console.log("Now, go and start your server:")
    const config = path.join("$HOME/paisley/demo", "demo_config.js")
    console.log(`node server.js --config ${config}`)

} 

catch (error) {
    console.error('Failed to complete setup:', error);
    process.exit(1);
}

