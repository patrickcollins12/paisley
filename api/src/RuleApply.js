const BankDatabase = require('./BankDatabase');
const RuleToSqlParser = require('./RuleToSqlParser');

class RuleApply {

    constructor() {
        this.db = new BankDatabase();
        // this.parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test
    }

    ruleApply(rule) {
        const parser = new RuleToSqlParser();
        const where = parser.parse(rule)
        const query = BankDatabase.allTransactionsQuery + " AND " + where.sql
        // console.log(`----------------------------------`)
        // console.log(`Rule: ${where.sql} :: ${where.params}`)
        // console.log("Rule:", rule)
        // console.log("Query:", query)

        const stmt = this.db.db.prepare(query);
        const rows = stmt.all(where.params);

        // for (const tx of rows) {
        //     // console.log(`Rule: ${where.sql} ${where.params}`)
        //     console.log()
        //     console.log(`    description: ${tx.description}`)
        //     console.log(`         amount: ${tx.amount}`)

        //     // console.log(`             tx: ${JSON.stringify(tx)}`)
        // }

        return rows
    }

    fetchRule(id) {
        const row = this.db.db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id);
        if (!row) {
            throw new Error(`No record found for id ${id}`);
        }
        return row;
    }
    

    // this is just a tester
    runSomeRules() {
        const rules = this.db.db.prepare('SELECT id FROM "rule"').all();
        
        for (const rid of rules) {
            let rule = this.fetchRule(rid.id)
            this.ruleApply(rule.rule)
            console.log("record:", rule)
        }
    }

}

module.exports = RuleApply;
