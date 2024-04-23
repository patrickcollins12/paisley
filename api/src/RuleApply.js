const BankDatabase = require('./BankDatabase');
const RuleToSqlParser = require('./RuleToSqlParser');

class RuleApply {

    constructor() {
        this.db = new BankDatabase().db;
        // this.parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test
    }

    // can take a full rule from the db, or just the id.
    ruleApply(rule) {
        const parser = new RuleToSqlParser();
        const where = parser.parse(rule)
        // console.log("where clause:", where)
        // where clause: {
        //     sql: 'description LIKE ?',
        //     params: [ '%deposit airtasker%' ],
        //     regexEnabled: false
        //   }
        // let query = 'SELECT * FROM "transaction" where 1=1 and ';
        let query = `
        select * from
        (        SELECT 
                  t.id,
                  t.datetime,
                  t.account,
          
                  t.description as description,
                  te.description as revised_description,
          
                  t.credit,
                  t.debit,
          
                  CASE
                    WHEN t.debit != '' AND t.debit > 0.0 THEN  -t.debit
                    WHEN t.credit != '' AND t.credit > 0.0 THEN  t.credit
                    ELSE 0.0
                  END AS amount,
          
                  t.balance,
                  t.type,
          
                  CASE
                      WHEN t.tags = '' OR t.tags IS NULL THEN ''
                      ELSE t.tags
                  END AS tags,
          
                  te.tags AS manual_tags,
                  te.auto_categorize 
                FROM 'transaction' t
                LEFT JOIN 'transaction_enriched' te ON t.id = te.id
        
        ) 
        WHERE 1=1 AND
        `        

        query+=where.sql
        console.log(`----------------------------------`)
        console.log(`Rule: ${where.sql} :: ${where.params}`)
        console.log("Rule:", rule)

        const stmt = this.db.prepare(query);
        const rows = stmt.all(where.params);

        for (const tx of rows) {
            // console.log(`Rule: ${where.sql} ${where.params}`)
            console.log()
            console.log(`             id: ${tx.id}`)
            console.log(`    description: ${tx.description}`)
            console.log(`         amount: ${tx.amount}`)

            // console.log(`             tx: ${JSON.stringify(tx)}`)
        }
    }

    fetchRule(id) {
        const query = 'SELECT * FROM "rule" where id = ?';
        const stmt = this.db.prepare(query);
        const rows = stmt.all([id]);
        if (rows.length > 1) {
            throw Error("Expected exactly one row for id")
        }
        if (!rows.length) {
            throw Error(`No record found for id ${id}`)
        }
        return rows[0]
    }

    // this is just a tester
    runSomeRules() {
        const query = 'SELECT * FROM "rule"';
        const result = this.db.prepare(query).all();
        const rules = new RuleApply()
        
        for (const record of result) {
            let record2 = this.fetchRule(record.id)
            this.ruleApply(record2.rule)
            console.log("record:", record2)

        }
        return true;
    }

    async classifyAllTransactions() {
        const query = 'SELECT id FROM "transaction"';
        const result = this.db.prepare(query).all();
        
        for (const record of result) {
            const id = record['id'];
            // console.log("here>> ", id);
            const classificationResult = await this.classifyId(id);
        }
    }

}

module.exports = RuleApply;
