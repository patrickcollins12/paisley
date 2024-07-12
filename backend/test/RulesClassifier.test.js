const RulesClassifier = require('../src/RulesClassifier');
const BankDatabase = require('../src/BankDatabase');
const RuleToSqlParser = require('../src/RuleToSqlParser');
const database_setup = require('./BankDatabaseDummy.js');

describe('Rules classifier', () => {
  let classifier;
  let db;

  beforeEach(() => {
    db = database_setup()
    classifier = new RulesClassifier(); // Initialize a new instance of the parser for each test
    parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test  
  });

  afterEach(() => {
    db.close(); // Close the database connection
  });

  //////////////////////////////
  // Testing a simple select query for transactions
  test('test a simple select on transactions', () => {
    const stmt = db.prepare('SELECT * FROM "transaction" WHERE id = ?');
    const result = stmt.get('tx1');

    // ['tx1', '2023-04-01 12:00:00', 'A123', 'Initial Deposit', 1000, 0, 1000, "DEP", 
    // JSON.stringify(['tag1', 'tag2']), 'Shop 1'],

    expect(result).toEqual({
      id: 'tx1',
      datetime: '2023-04-01 03:00:00',
      account: 'A123',
      description: 'Initial Deposit',
      credit: 1000,
      debit: 0,
      balance: 1000,
      type: "DEP",
      tags: JSON.stringify({"tags": ['tag1', 'tag2'], "rule":[1,2]}),
      party: JSON.stringify({"party": ['Shop 1'], "rule":[1]  })
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
      party: '["Bank Inc"]'
    });
  });


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

    expect(result.party).toEqual('["Bank Inc"]')

    //  whereSqlObj = {sql: 'description LIKE ?', params: ["%Initial%"]}
    const whereSqlObj = parser.parse(result.rule);
    expect(whereSqlObj.sql).toEqual('description LIKE ?')

    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier._applyRule(
      1,
      whereSqlObj.sql, 
      whereSqlObj.params, 
      ["tx1"], 
      JSON.parse(result.tag), 
      JSON.parse(result.party))

    expect(cnt).toBe(1)

    const stmt2 = db.prepare('SELECT * FROM "transaction" WHERE id = ?');
    const result2 = stmt2.get("tx1");
    expect(result2.tags).toEqual('{\"tags\":[\"tag1\",\"tag2\",\"Transfer > 1\",\"Finance > Stuff\"],\"rule\":[1,2]}')
    expect(result2.party).toEqual('{\"party\":[\"Bank Inc\"],\"rule\":1}')

  });


  test('test a classify of multiple records', () => {
    const whereSqlObj = parser.parse(`description = /[\\w]/i`);
    expect(whereSqlObj.sql).toEqual(`description REGEXP ?`)
    expect(whereSqlObj.params[0]).toEqual('[\\w]/i')
    

    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier._applyRule(1,whereSqlObj.sql, whereSqlObj.params, null, ['blah'], ['blah'])
    // expect(cnt).toBe(4) // FIX THIS, SHOULD RETURN 4 not 0
  });

  test('test a classify of 1 rule to all txns', () => {
    const whereSqlObj = parser.parse(`description = /[\\w]/i`);
    expect(whereSqlObj.sql).toEqual(`description REGEXP ?`)
    expect(whereSqlObj.params[0]).toEqual('[\\w]/i')
    
    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier._applyRule(1,whereSqlObj.sql, whereSqlObj.params, ["tx1","tx2"], ['blah'], ['blah'])
    // expect(cnt).toBe(2) // FIX THIS, SHOULD RETURN 2 not 0
  });


  test('test a classify of all rules to all txs', () => {
    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier.applyAllRules()
    expect(cnt).toBe(2)
  });

  test('test a classify of all rules to 2 txn', () => {
    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier.applyAllRules(["tx1", "tx2"])
    expect(cnt).toBe(2)

    const stmt = db.prepare('SELECT * FROM "transaction" WHERE id in (?, ?)');
    const result = stmt.all(['tx1','tx2']);

    console.log("result>>",JSON.stringify(result,null,"\t"))

    expect(result[0].tags).toBe("{\"tags\":[\"Transfer > 1\",\"Finance > Stuff\"],\"rule\":[1]}")
    expect(result[1].tags).toBe("{\"tags\":[\"Large > Tag1\",\"Small > Tag2\"],\"rule\":[2]}")

  });


  test('test fetch txids', () => {
    // applyRule(ruleWhereClause, params, txids, newTags, party) {
    const cnt = classifier.getTransactionsMatchingRuleId(1)
    expect(cnt).toEqual( ["tx1","tx2"] )
  });

  test('clear txids rules', () => {
    classifier.clearTags(["tx1","tx2"])
  });

  
});


