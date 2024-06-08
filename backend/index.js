const minimist = require('minimist');
const ExpressServer = require('./src/ExpressServer');
const config = require('./src/Config');
const TransactionFileProcessor = require('./src/TransactionFileProcessor');

// Load command line arguments
const args = minimist(process.argv);

// Show help if --help is present
if (args.help) {
    console.log(`
  Usage: node index.js [options]
  
  Options:
    --config               Path to the configuration file.
    --disabletfp           Disable the Transaction CSV File Processor.
    --globalDisableAuth    Globally disable authentication. Defaults to false unless explicitly set to "true".
    --port                 Port for the Express server to run on. Defaults to 4000.
    --help                 Show this help message and exit.
    `);
    process.exit(0);
  }
  
// Load the config
config.load(args["config"]);

////////////
// TFP

// Start the Transaction CSV File Processor
if(! args["disabletfp"]) {
    const tfp = new TransactionFileProcessor();
    tfp.start();    
}

////////////
// EXPRESS

// Determine if auth should be enabled. 
// Defaults to false unless explicitly set to "true"
const globalDisableAuth = args["globalDisableAuth"] === "true";
const port = args["port"] || 4000;

// Start the Express Server
const expressServer = new ExpressServer({
    enableApiDocs: true,
    port: port,
    globalDisableAuth: globalDisableAuth
});
expressServer.start()