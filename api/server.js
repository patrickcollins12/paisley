// system imports
const express = require('express');
const { body, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const cors = require('cors');
const JWTAuthenticator = require('./src/JWTAuthenticator'); // Update the path as necessary
const os = require('os');
const path = require('path');
const minimist = require('minimist');

// load command line arguments
const args = minimist(process.argv);

// load the config
const config = require('./src/Config');
// console.log("args:",args);
config.load(args["config"])

const CSVParserFactory = require('./src/CSVParserFactory');
const FileWatcher = require('./src/FileWatcher');
const FileMover = require('./src/FileMover');

const RulesClassifier = require('./src/RulesClassifier');
const classifier = new RulesClassifier()

async function initializeCsvParserFactory() {
  const csvParserFactory = new CSVParserFactory();
  await csvParserFactory.loadParsers();
  return csvParserFactory;
}

async function processFile(csvParserFactory, watchDir, processedDir, file) {
  try {
    const csvParser = await csvParserFactory.chooseParser(file);
    let parseResults = await csvParser.parse(file);

    if (parseResults.isSuccess()) {
      // console.log(parseResults); // prints all the findings
      await FileMover.moveFile(watchDir, file, processedDir);
    }

    // CLASSIFY THE RECENTLY ADDED TRANSACTIONS
    console.log("ready to classify")
    classifier.applyAllRules(parseResults.inserted_ids)
    console.log("Finished processing:", file);

  } catch (error) {
    console.error("Error processing file:", error);
  }
}

async function setupParsersAndStartWatching() {
  const csvParserFactory = await initializeCsvParserFactory();
  const watchDir = config.csv_watch || path.join(os.homedir(), "Downloads/bank_statements");
  const processedDir = config.csv_processed || path.join(os.homedir(), "Downloads/bank_statements/processed");
  const fileWatcher = new FileWatcher(watchDir, processedDir);

  fileWatcher.startWatching(file => processFile(csvParserFactory, watchDir, processedDir, file));
  console.log("Watching for CSV files");
}

setupParsersAndStartWatching();

////////////////
// EXPRESS SERVER at localhost:3000/data

app.use(cors());
app.use(express.json());

// Load the protected routes
const routes = [
  './src/routes/transactions.js',
  './src/routes/update_transactions.js',
  './src/routes/tags.js',
  './src/routes/balances.js',
  './src/routes/rule.js',
  './src/routes/rules.js',
  './src/routes/parties.js',
  './src/routes/login.js',
  './src/routes/signup.js'
]

for (const route of routes) {
  app.use(require(route));
}

// Setup the swagger docs
// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Paisley API',
//       version: '1.0.0',
//       description: 'The official API for interacting with Paisley Finance',
//     },
//   },
//   apis: routes // Path to the API docs
// };

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Paisley API',
      version: '1.0.0',
      description: 'The official API for interacting with Paisley Finance',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [...routes],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
