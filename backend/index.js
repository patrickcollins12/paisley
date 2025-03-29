const minimist = require('minimist');
const config = require('./src/Config');
// Load command line arguments
const args = minimist(process.argv);

// Show help if --help is present
if (args.help) {
    logger.info(`
  Usage: node index.js [options]
  
  Options:
    --config               Path to the configuration file.
    --disabletfp           Disable the Transaction CSV File Processor.
    --playwright           Playwright scheduler enable/disable. Defaults to true.
    --globalDisableAuth    Globally disable authentication. Defaults to false unless explicitly set to "true".
    --port                 Port for the Backend API Express server to run on. Defaults to 4000.
    --help                 Show this help message and exit.
    `);
    process.exit(0);
  }
  
// Load the config
console.log(`Loading config from: ${args["config"]}`);
config.load(args["config"]);

// round 2 loads
const ExpressServer = require('./src/ExpressServer');
const TransactionFileProcessor = require('./src/TransactionFileProcessor');
const PlaywrightRunner = require('./src/PlaywrightRunner');
const logger = require('./src/Logger');

////////////
// Start the Transaction CSV File Processor
if(! args["disabletfp"]) {
    const tfp = new TransactionFileProcessor();
    tfp.start();    
}

////////////
// Start the Playwright runner
if(! args["playwright"]) {
  const pr = new PlaywrightRunner();
  pr.startCronScheduler()
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