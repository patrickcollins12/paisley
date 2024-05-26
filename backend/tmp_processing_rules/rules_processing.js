const fs = require('fs');
const Database = require('better-sqlite3');
const BankDatabase = require('../src/BankDatabase');
const config = require('../src/Config');
const minimist = require('minimist');
// load command line arguments
const args = minimist(process.argv);

config.load(args["config"])
let file = args["file"] || 'rules.txt'

// process.exit()

let db = new BankDatabase().db;

// Read the rules.txt file
const fileContent = fs.readFileSync(file, { encoding: 'utf-8' });

// Split the content into lines
const lines = fileContent.split('\n');

// Prepare to capture the current group from comments
let currentGroup = '';

// Parse the lines
const rules = lines.map(line => {
    // Check for comment lines
    if (line.match(/^\s*$/)) {
        // console.log("skipping line")
    }

    if (line.trim().startsWith('//')) {
        currentGroup = line.trim().slice(2).trim(); // Capture the group name from the comment
        // console.log("currenct group: ", currentGroup)
        return null; // Ignore comment lines
    }

    // Parse valid rule lines
    const rules = []
    if (line.match(/^\s*"description:/)) {
        const obj = JSON.parse(`{${line}}`)
        // obj.group=currentGroup
        const [[rule, tags]] = Object.entries(obj);

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
        return {
            rule,
            tags: tagsWithoutMerchant,
            party: tagsWithMerchant2,
            group: currentGroup
        };
    }

    return null;
}).filter(rule => rule !== null);

console.log(rules)
process.exit()

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
