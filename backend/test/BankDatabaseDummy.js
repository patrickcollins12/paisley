// const minimist = require('minimist');
// const config = require('../src/Config');
// const args = minimist(process.argv.slice(2));
// config.load(args.config);
const BankDatabase = require('../src/BankDatabase');


function database_setup() {
  let db = new BankDatabase(':memory:').db

  // Create tables
  db.exec(`
        CREATE TABLE "transaction" (
            "id"    TEXT NOT NULL UNIQUE,
            "datetime"  TEXT, 
            "account"   TEXT,
            "description"   TEXT,
            "credit" INTEGER,
            "debit" INTEGER,
            "balance"   INTEGER,
            "type"  INTEGER,
            "tags" JSON,
            'party' JSON, 
            PRIMARY KEY("id")
        );
        CREATE TABLE "rule" (
            "id"    INTEGER NOT NULL UNIQUE,
            "rule"  TEXT NOT NULL,
            "tag"   JSON,
            "party" JSON,
            PRIMARY KEY("id" AUTOINCREMENT)
        );
        CREATE TABLE "transaction_enriched" (
          "id"	TEXT NOT NULL UNIQUE,
          "tags"	JSON,
          "description"	TEXT, "auto_categorize" INTEGER, party JSON,
          PRIMARY KEY("id")
        );
    `);

  // Insert sample transactions
  const insertTxn = db.prepare(`
        INSERT INTO "transaction" (id, datetime, account, description, credit, debit, balance, 
          type, tags, party)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

  // Sample data for transactions
  const transactions = [

    ['tx1', '2023-04-01 12:00:00', 'A123', 'Initial Deposit', 1000, 0, 1000, "DEP",
      JSON.stringify(['tag1', 'tag2']), 'Shop 1'],

    ['tx2', '2023-04-02 12:00:00', 'A123', 'Coffee Shop', 0, 100, 900, "DEP",
      JSON.stringify(['tag1', 'tag2']), 'Shop 2'],

    ['tx3', '2023-04-03 12:00:00', 'A123', 'Book Store', 0, 200, 700, "TXN",
      JSON.stringify(['tag2', 'tag3']), 'Shop 3']

  ];

  transactions.forEach(txn => {
    insertTxn.run(...txn);
  });

  // Insert sample rules
  const insertRule = db.prepare(`INSERT INTO "rule" (rule, tag, party) VALUES (?, ?, ?);`);

  // Sample data for rules
  const rules = [
    ["description = 'Initial'",
      JSON.stringify(['Transfer > 1', 'Finance > Stuff']),
      '["Bank Inc"]'],

    ["type = 'DEP' AND debit > 50",
      JSON.stringify(['Large > Tag1', 'Small > Tag2']),
      '["Party Inc"]']

  ];

  rules.forEach(rule => {
    insertRule.run(...rule);
  });

  return db
}
module.exports = database_setup;
