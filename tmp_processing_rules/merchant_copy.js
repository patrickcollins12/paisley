// CONVERTS rules.js to the rule table
// in the process it uses RuleConverter to convert v1 rules to v2 rules.

const fs = require('fs');
const Database = require('better-sqlite3');
const BankDatabase = require('../src/BankDatabase');
const config = require('../src/Config');
const minimist = require('minimist');

// load command line arguments
const args = minimist(process.argv);

config.load(args["config"])

let db = new BankDatabase().db;

const sql = "select * from 'transaction';"
const stmt = db.prepare(sql);
const results = stmt.all(); // get() for a single row, all() for multiple rows

const updateStmt = db.prepare("update 'transaction' SET tags= ?, party=? where id = ?");

// Parse the lines
var rules = []
for (const tx of results) {
    console.log(tx.id,tx.tags)

    const tags = JSON.parse(tx.tags || "[]")

    const tagsWithoutMerchant = tags.filter(tag => !tag.toLowerCase().includes('(merchant)'));

    const m = tags.filter(tag => tag.toLowerCase().includes('(merchant)'));
    const tagsWithMerchant = m.map(tag => {
        if (tag.toLowerCase().includes('(merchant)')) {
            // Remove '(Merchant)' or '(merchant)' from the tag and trim any extra whitespace
            return tag.replace(/\(merchant\)/i, '').trim();
        }
        return tag;
    });

    console.log(tagsWithoutMerchant,tagsWithMerchant)
    updateStmt.run(JSON.stringify(tagsWithoutMerchant), JSON.stringify(tagsWithMerchant), tx.id )

    // // const merchantsFiltered = tagsWithMerchant.map()
    // rules.push({
    //     rule,
    //     tags: tagsWithoutMerchant,
    //     party: tagsWithMerchant2,
    //     group: ""
    // });
}

// // console.log(rules)
// // process.exit()

// db.exec(`DROP TABLE IF EXISTS "rule";`);
// db.exec(`CREATE TABLE "rule" (
// 	"id"	INTEGER NOT NULL UNIQUE,
// 	"rule"	TEXT NOT NULL,
// 	"group"	TEXT,
// 	"tag"	JSON,
// 	"party"	JSON,
//     "comment" TEXT,
// 	PRIMARY KEY("id" AUTOINCREMENT)
//     );`);

// // Prepare the insert statement
// const insertStmt = db.prepare(`INSERT INTO 'rule' (rule, tag, party, 'group', comment) VALUES (?, ?, ?, ?, ?)`);

// const ruleConverter = new RuleConverter();

// // Begin transaction
// const insertMany = db.transaction((rules) => {
//     for (const rule of rules) {
//         rule.rule_new = ruleConverter.convertV1toV2(rule.rule)
//         // rule.rule_new = rule_new.replace(/\\b/g,'\b')
//         console.log("rule>>",rule)
//         insertStmt.run(rule.rule_new, JSON.stringify(rule.tags), JSON.stringify(rule.party), rule.group, rule.rule);
//     }
// });

// // Execute the transaction
// insertMany(rules);

// console.log('Data insertion complete.');
