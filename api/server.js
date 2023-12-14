const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const CSVParserFactory = require('./CSVParserFactory'); // Adjust the path according to your file structure
const csvpf = new CSVParserFactory()
const BankDatabase = require('./BankDatabase');
const ConfigManager = require('./ConfigManager.js');
const os = require('os');
const path = require('path');

app.use(cors());
app.use(bodyParser.json());

// Using default template configuration
const configManager = new ConfigManager('pfm');
const config = configManager.readConfig();
console.log('Configuration:', config);

// open the DB
bankdb = new BankDatabase( config.database )

// Setup the filewatcher and start watching for transaction.
const FileWatcher = require('./FileWatcher'); // Adjust the path according to your file structure
const watchDir = config.csv_watch || path.join(os.homedir(),"Downloads/bank_statements");
const fileWatcher = new FileWatcher(watchDir, "*.csv");

fileWatcher.startWatching( (filePath) => csvpf.processCSVFile(filePath) );

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