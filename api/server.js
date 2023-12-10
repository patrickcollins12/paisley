const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const CSVParserFactory = require('./CSVParserFactory'); // Adjust the path according to your file structure
const csvpf = new CSVParserFactory()
const BankDatabase = require('./BankDatabase');

app.use(cors());
app.use(bodyParser.json());

// open the DB
bankdb = new BankDatabase()

async function processCSVFile(filePath) {
  const parser = await csvpf.getParser(filePath);
  if (parser) {
    console.log(`Using ${parser.identifier} parser for file ${filePath}`);
    parser.setDB(bankdb);
    parser.parse(filePath)  
  }
  else {
    console.log(`Couldn't find parser for file ${filePath}`);
  }
}


// Setup the filewatcher.
const FileWatcher = require('./FileWatcher'); // Adjust the path according to your file structure
const watchDir = process.env.WATCHDIR || "/Users/patrick/Downloads/bank_statements";
const fileWatcher = new FileWatcher(watchDir, "*.csv");
fileWatcher.startWatching(processCSVFile);

// server cats
app.get('/data', async (req, res) => {
  query = `
      SELECT 
          t.*, 
          GROUP_CONCAT(c.category,";") categories 
      FROM "transaction" t 
      LEFT JOIN category c
      ON t.id=c.transaction_id 
      GROUP by t.id`

  bankdb.db.all(query, [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }

    for (const row of rows) {
      const cats = row.categories || "" 
      row["categories"] = cats.split(";").filter(Boolean);
    }

    res.json( rows )
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

