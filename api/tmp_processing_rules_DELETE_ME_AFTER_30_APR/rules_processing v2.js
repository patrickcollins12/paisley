const fs = require('fs');
const Database = require('better-sqlite3');
const BankDatabase = require('./src/BankDatabase');
const config = require('./src/Config');
const minimist = require('minimist');
// load command line arguments
const args = minimist(process.argv);

config.load(args["config"])
let file = args["file"] || config['rules']|| 'rules.js'

// process.exit()

let db = new BankDatabase().db;

// Read the rules.txt file
const rulesObj = require(file);

// Parse the lines
var rules = []
for (const [rule, tags] of Object.entries(rulesObj)) {
    // console.log(rule, tags)
    const tagsWithoutMerchant = tags.filter(tag => !tag.toLowerCase().includes('(merchant)'));

    const tagsWithMerchant = tags.filter(tag => tag.toLowerCase().includes('(merchant)'));
    const tagsWithMerchant2 = tagsWithMerchant.map(tag => {
        if (tag.toLowerCase().includes('(merchant)')) {
            // Remove '(Merchant)' or '(merchant)' from the tag and trim any extra whitespace
            return tag.replace(/\(merchant\)/i, '').trim();
        }
        return tag;
    });

    // const merchantsFiltered = tagsWithMerchant.map()
    rules.push({
        rule,
        tags: tagsWithoutMerchant,
        party: tagsWithMerchant2,
        group: ""
    });
}

// console.log(rules)
// process.exit()

db.exec(`DROP TABLE IF EXISTS "rule";`);
db.exec(`CREATE TABLE "rule" (
	"id"	INTEGER NOT NULL UNIQUE,
	"rule"	TEXT NOT NULL,
	"group"	TEXT,
	"tag"	JSON,
	"party"	JSON,
	PRIMARY KEY("id" AUTOINCREMENT)
    );`);

// Prepare the insert statement
const insertStmt = db.prepare(`INSERT INTO 'rule' (rule, tag, party, 'group') VALUES (?, ?, ?, ?)`);

// Begin transaction
const insertMany = db.transaction((rules) => {
    for (const rule of rules) {
        console.log(rule)
        insertStmt.run(rule.rule, JSON.stringify(rule.tags), JSON.stringify(rule.party), rule.group);
    }
});

// Execute the transaction
insertMany(rules);

console.log('Data insertion complete.');
