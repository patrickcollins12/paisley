// system imports
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const path = require('path');

// local imports
const config = require('./Config');
const CSVParserFactory = require('./CSVParserFactory');
const FileWatcher = require('./FileWatcher');
const FileMover = require('./FileMover');
const RulesClassifier = require('./RulesClassifier');

app.use(cors());
app.use(bodyParser.json());

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

      classifier = new RulesClassifier()
      await classifier.loadRules()

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
  console.log("Watching for files");
}

setupParsersAndStartWatching();









// runServer();

function runServer() {
  // server cats
  app.get('/data', async (req, res) => {
    query = `
        SELECT 
            t.*, 
            GROUP_CONCAT(c.category,';') categories 
        FROM "transaction" t 
        LEFT JOIN category c
        ON t.id=c.transaction_id 
        GROUP by t.id`

    try {
      console.log(query)
      const stmt = bankdb.db.prepare(query);

      const rows = stmt.all();

      for (const row of rows) {
        const cats = row.categories || "";
        row["categories"] = cats.split(";").filter(Boolean);
        // row['jsondata'] = ""
      }

      res.json(rows);
    } catch (err) {
      console.log("error", err.message);
      res.status(400).json({ "error": err.message });
    }

  });

  //temporarily disable the webserver
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
