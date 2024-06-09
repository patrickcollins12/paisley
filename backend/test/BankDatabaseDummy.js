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
          "description"	TEXT, 
          "auto_categorize" INTEGER, 
          "party" JSON,
          PRIMARY KEY("id")
        );
    `);

  // Insert sample transactions
  const insertTxn = db.prepare(`
        INSERT INTO "transaction" (id, datetime, account, description, credit, debit, balance, 
          type, tags, party)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
  const insertTxnE = db.prepare(`
      INSERT INTO "transaction_enriched" (id, description, tags, party, auto_categorize)
      VALUES (?, ?, ?, ?, ?);
  `);


  // Sample data for transactions
  const transactions = [
    ['tx1', '2023-04-01 12:00:00', 'A123', 'Initial Deposit', 1000, 0, 1000, "DEP",
      JSON.stringify(['tag1', 'tag2']), JSON.stringify(['Shop 1'])],

    ['tx2', '2023-04-02 12:00:00', 'A123', 'Coffee Shop', 0, 100, 900, "DEP",
      JSON.stringify(['tag1', 'tag2']), JSON.stringify(['Shop 2'])],

    ['tx3', '2023-04-03 12:00:00', 'A123', 'Book Store', 0, 200, 700, "TXN",
      JSON.stringify(['tag2', 'tag3']), JSON.stringify(['Shop 3'])],

    ['tx4', '2023-04-04 12:00:00', 'A345', 'Hardware Store', 0, 5, 500, "TXN",
      JSON.stringify([]), JSON.stringify([])]
  ];

  // id, description, tags, party, auto_categorize
  const transaction_enriched = [
    ['tx1', 'Initial Deposit (revised)', JSON.stringify(['tag6', 'tag7']), JSON.stringify(['Shop 1a']), 1],
    ['tx2', 'Coffee Shop (revised)', JSON.stringify(['tag8', 'tag9']), JSON.stringify(['Shop 2a']), 1],
    ['tx3', '', JSON.stringify([]), JSON.stringify(['Shop 3']), 0],
    // ['tx4', 'Hardware Store',  JSON.stringify([]),               JSON.stringify(['Shop 4'])]
  ];

  transactions.forEach(txn => { insertTxn.run(...txn); });
  transaction_enriched.forEach(txn => { insertTxnE.run(...txn); });


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
