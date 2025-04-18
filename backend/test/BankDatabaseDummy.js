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
            'jsondata' JSON,
            PRIMARY KEY("id")
            -- Consider adding FK constraint to account if needed by tests
            -- FOREIGN KEY("account") REFERENCES "account"("accountid") ON DELETE CASCADE
        );

        CREATE TABLE "account_history" (
            "historyid" INTEGER PRIMARY KEY AUTOINCREMENT,
            "accountid" TEXT NOT NULL,
            "datetime" TEXT,
            "balance" REAL,
            "data" JSON,
            FOREIGN KEY("accountid") REFERENCES "account"("accountid") ON DELETE CASCADE
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
        CREATE TABLE "account" (
	        "accountid"	TEXT NOT NULL UNIQUE,
	        "institution"	TEXT,
	        "name"	TEXT,
	        "holders"	TEXT,
	        "currency"	TEXT,
          "type" TEXT, 
          "category" TEXT, -- Add category if used/needed by other logic
          "timezone" TEXT, 
          "shortname" TEXT,
          "parentid" TEXT, -- Add parentid
          "status" TEXT,   -- Add status
          "metadata" TEXT, -- Add metadata (as TEXT to store JSON string)
	        PRIMARY KEY("accountid")
        );
    `);

  // --- Insert Sample Data --- 



  
  // Insert sample accounts
  const insertAccount = db.prepare(`
        INSERT INTO "account" (accountid, name, currency, type) 
        VALUES (?, ?, ?, ?);
    `);
  const accounts = [
    ['A123', 'Test Account 1', 'USD', 'Checking'],
    ['A345', 'Test Account 2', 'CAD', 'Savings']
  ];
  accounts.forEach(acc => { insertAccount.run(...acc); });




  // Insert sample transactions (linked to A123)
  const insertTxn = db.prepare(`
        INSERT INTO "transaction" (id, datetime, account, description, credit, debit, balance, 
          type, tags, party)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
  const transactions = [
    ['tx1', '2023-04-01 03:00:00', 'A123', 'Initial Deposit', 1000, 0, 1000, "DEP",
      JSON.stringify({ "tags": ['tag1', 'tag2'], "rule": [1, 2] }),
      JSON.stringify({ "party": ['Shop 1'], "rule": [1] })
    ],
    ['tx2', '2023-04-02 03:00:00', 'A123', 'Coffee Shop', 0, 100, 900, "DEP",
      JSON.stringify({ "tags": ['tag1', 'tag2'], "rule": [1, 2] }),
      JSON.stringify({ "party": ['Shop 2'], "rule": [2] })
    ],
    ['tx3', '2023-04-03 03:00:00', 'A123', 'Book Store', 0, 200, 700, "TXN",
      JSON.stringify({ "tags": ['tag2', 'tag3'], 'rule': [2, 3] }),
      JSON.stringify({ "party": ['Shop 3'], "rule": [3] })
    ],
    ['tx4', '2023-04-04 03:00:00', 'A345', 'Hardware Store', 0, 5, 500, "TXN", // Belongs to A345
      JSON.stringify({}),
      JSON.stringify({})
    ]
  ];
  transactions.forEach(txn => { insertTxn.run(...txn); });



  // Insert sample transaction_enriched (linked to tx1, tx2)
  const insertTxnE = db.prepare(`
      INSERT INTO "transaction_enriched" (id, description, tags, party, auto_categorize)
      VALUES (?, ?, ?, ?, ?);
  `);
  const transaction_enriched = [
    ['tx1', 'Initial Deposit (revised)', JSON.stringify(['tag6', 'tag7']), JSON.stringify(['Shop 1a']), 1],
    ['tx2', 'Coffee Shop (revised)', JSON.stringify(['tag8', 'tag9']), JSON.stringify(['Shop 2a']), 1],
    ['tx3', '', JSON.stringify([]), JSON.stringify(['Shop 3']), 0],
    // ['tx4', 'Hardware Store',  JSON.stringify([]),               JSON.stringify(['Shop 4'])]
  ];
  transaction_enriched.forEach(txn => { insertTxnE.run(...txn); });



  // Insert sample account history (linked to A123)
  const insertHistory = db.prepare(`
        INSERT INTO "account_history" (accountid, datetime, balance, data)
        VALUES (?, ?, ?, ?);
    `);
  const history = [
    ['A123', '2023-03-31 10:00:00', 0, null],
    ['A123', '2023-04-01 10:00:00', 1000, JSON.stringify({ rate: 0.1 })],
    ['A123', '2023-04-02 10:00:00', 900, null],
    ['A345', '2023-04-03 10:00:00', 505, null] // Belongs to A345
  ];
  history.forEach(hist => { insertHistory.run(...hist); });




  // Insert sample rules
  const insertRule = db.prepare(`INSERT INTO "rule" (rule, tag, party) VALUES (?, ?, ?);`);
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
