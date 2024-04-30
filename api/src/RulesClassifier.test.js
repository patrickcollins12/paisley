const RulesClassifier = require('./RulesClassifier');
const BankDatabase = require('./BankDatabase');
const RuleToSqlParser = require('./RuleToSqlParser');

describe('Rules classifier', () => {
  let classifier;
  let db;
  beforeEach(() => {
    db = new BankDatabase(':memory:').db
    classifier = new RulesClassifier(); // Initialize a new instance of the parser for each test
    parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test


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
        'Bank Inc'],

      ["type = DEP AND debit > 50",
        JSON.stringify(['Large > Tag1', 'Small > Tag2']),
        'Party Inc']

    ];

    rules.forEach(rule => {
      insertRule.run(...rule);
    });

  });

  afterEach(() => {
    db.close(); // Close the database connection
  });

  // Testing a simple select query for transactions
  test('test a simple select on transactions', () => {
    const stmt = db.prepare('SELECT * FROM "transaction" WHERE id = ?');
    const result = stmt.get('tx1');

    // ['tx1', '2023-04-01 12:00:00', 'A123', 'Initial Deposit', 1000, 0, 1000, "DEP", 
    // JSON.stringify(['tag1', 'tag2']), 'Shop 1'],

    expect(result).toEqual({
      id: 'tx1',
      datetime: '2023-04-01 12:00:00',
      account: 'A123',
      description: 'Initial Deposit',
      credit: 1000,
      debit: 0,
      balance: 1000,
      type: "DEP",
      tags: JSON.stringify(['tag1', 'tag2']),
      party: 'Shop 1'
    });
  });

  // Testing a simple select query for rules
  test('test a simple select on rules', () => {
    const stmt = db.prepare('SELECT * FROM "rule" WHERE id = ?');
    const result = stmt.get(1);

    expect(result).toEqual({
      id: 1,
      rule: "description = 'Initial'",
      tag: JSON.stringify(['Transfer > 1', 'Finance > Stuff']),
      party: 'Bank Inc'
    });
  });


  // Testing a simple select query for rules
  test('test a simple classify', () => {
    const stmt = db.prepare('SELECT * FROM "rule" WHERE id = ?');
    const result = stmt.get(1);

    // rule result
    // {
    //   id:1
    //   party:'Bank Inc'
    //   rule:"description = 'Initial'"
    //   tag:'["Transfer > 1","Finance > Stuff"]'
    // }

    expect(result.party).toEqual("Bank Inc")

    //  {sql: 'description LIKE ?', params: ["%Initial%"]}
    const whereSqlObj = parser.parse(result.rule);
    expect(whereSqlObj.sql).toEqual('description LIKE ?')

    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier.applyRule(whereSqlObj.sql, whereSqlObj.params, ["tx1"], JSON.parse(result.tag), result.party)
    expect(cnt).toBe(1)

    const stmt2 = db.prepare('SELECT * FROM "transaction" WHERE id = ?');
    const result2 = stmt2.get("tx1");
    expect(result2.tags).toEqual('["tag1","tag2","Transfer > 1","Finance > Stuff"]')
  });

});