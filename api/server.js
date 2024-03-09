// system imports
const express = require('express');
const { body, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');


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
const BankDatabase = require('./src/BankDatabase');
const classifier = new RulesClassifier()

// setup swagger
const swaggerDocument = require('./swagger.json');

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


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

    // if (parseResults.hadInserts()) {
    // Run the classifier on the parsed data
    // results should hold the ids of the entries just added, for classification.
    console.log("ready to classify")
    // console.log(parseResults.inserted_ids)

    // await classifier.loadRules()

    for (let id of parseResults.inserted_ids) {
      const classificationResult = await classifier.classifyId(id);
      // console.log("Classification Done", classificationResult);
    }

    // }

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
// serve at localhost:3000/data
runServer();
function runServer() {
  let db = new BankDatabase();

  // server cats
  app.get('/data', async (req, res) => {
    let query = "select * from transaction_with_account"

    try {
      // console.log(query)
      const stmt = db.db.prepare(query);
      const rows = stmt.all();

      res.json(rows);
    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }

  });

  // server cats
  app.get('/tags', async (req, res) => {
    let query = `SELECT DISTINCT json_each.value
    FROM 'transaction',
         json_each('transaction'.tags)
    WHERE json_valid('transaction'.tags)
    ORDER BY json_each.value;`

    try {
      // console.log(query)
      const stmt = db.db.prepare(query);
      const rows = stmt.all().map(obj => obj.value);
      res.json(rows);
    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }

  });


  app.post('/update_transaction', [
    // Validate and sanitize the ID
    body('id').trim().isLength({ min: 1 }).withMessage('ID is required.'),
    // Make 'tags' optional but validate if provided
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('tags.*').optional().isString().withMessage('Each tag must be a string.')
      .isLength({ max: 1000 }).withMessage('Tag names must be under 1000 characters.'),
    // Make 'description' optional but validate if provided
    body('description').optional().isString().withMessage('Description must be a string.')
      .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters.'),
  ], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, tags, description } = req.body;


    try {

      // Simplified check if the ID exists in the 'transaction' table
      let checkQuery = `SELECT id FROM 'transaction' WHERE id = ? LIMIT 1`;
      const checkStmt = db.db.prepare(checkQuery);
      const result = checkStmt.get(id);
      if (!result) {
        // If the result is undefined or null, the ID does not exist
        return res.status(404).json({ "error": "ID does not exist in 'transaction' table" });
      }

      let fields = ['id'];
      let placeholders = ['?'];
      let updateSet = [];
      let params = [id];
  
      if (tags) {
        fields.push('tags');
        placeholders.push('json(?)');
        updateSet.push('tags = excluded.tags');
        params.push(JSON.stringify(tags));
      }
  
      if (description) {
        fields.push('description');
        placeholders.push('?');
        updateSet.push('description = excluded.description');
        params.push(description);
      }
  
      // Construct the query only with the necessary fields
      let query = `INSERT INTO transaction_enriched (${fields.join(', ')})
                   VALUES (${placeholders.join(', ')})
                   ON CONFLICT(id) DO UPDATE SET ${updateSet.join(', ')};`;
  
      db.db.prepare(query).run(params);
      res.json({ "success": true });


    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }
  });


  //temporarily disable the webserver
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
