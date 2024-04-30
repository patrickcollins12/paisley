const BankDatabase = require('./BankDatabase');
const config = require('./Config');

class RulesClassifier {

    constructor() {
        this.db = new BankDatabase();
        this.ruleComponents = {}
    }

    applyRule(ruleWhereClause, params, txids, newTags, party) {
        // Building the dynamic part of the WHERE clause based on the txids provided
        let txidsCondition = '';
        // let params = [];

        if (txids && txids.length > 0) {
            txidsCondition = `AND id IN (${txids.map(() => '?').join(', ')})`;
            params = params.concat(txids);
        }

        // Fetch the current tags for transactions that match the rule and txids
        const fetchSql = `
            SELECT id, tags
            FROM 'transaction'
            WHERE ${ruleWhereClause} ${txidsCondition}
        `;
        const fetchStmt = this.db.db.prepare(fetchSql);
        const transactions = fetchStmt.all(params);

        // Prepare the SQL statement for updating tags and party
        const updateSql = `
            UPDATE 'transaction'
            SET tags = ?,
                party = COALESCE(?, party)
            WHERE id = ?
        `;
        const updateStmt = this.db.db.prepare(updateSql);

        // Update each transaction with the new merged tags
        transactions.forEach(transaction => {
            const existingTags = JSON.parse(transaction.tags || '[]');
            const mergedTags = Array.from(new Set([...existingTags, ...newTags])); // Use Set to remove duplicates
            const tagsJson = JSON.stringify(mergedTags);
            updateStmt.run(tagsJson, JSON.stringify(party), transaction.id);
        });

        console.log(`Rows updated: ${transactions.length}`);
        return transactions.length
    }


    // fetches directly all ids and calls this.classifyId(id)
    async classifyAllTransactions() {
        const query = 'SELECT id FROM "transaction"';
        const result = this.db.db.prepare(query).all();

        for (const record of result) {
            const id = record['id'];
            // console.log("here>> ", id);
            const classificationResult = await this.classifyId(id);
        }
    }

    fetchTransactionFromDatabase(id) {
        const query = 'SELECT * FROM "transaction" WHERE id = ?';
        try {
            const result = this.db.db.prepare(query).all(id);
            if (result.length !== 1) {
                throw new Error(`Expected 1 row in transaction for ${id}`);
            }
            return result[0];
        } catch (err) {
            console.error("Query error:", err.message);
            throw err;
        }
    }

    saveTagsToDatabase(id, tags) {
        const query = 'UPDATE "transaction" SET tags = ? WHERE id = ?';

        try {
            // Assuming `tags` is an array, convert it to a string 
            // (or other format suitable for your database schema)
            const tagsFormatted = JSON.stringify(tags);

            // Prepare and run the update statement
            const stmt = this.db.db.prepare(query);
            const result = stmt.run(tagsFormatted, id);

            // `result.changes` indicates the number of rows affected
            if (result.changes !== 1) {
                throw new Error(`Expected to update 1 row in transaction for ${id}, but updated ${result.changes}`);
            }

            // Return the result or a confirmation message
            return result; // or return a custom object/message as needed
        } catch (err) {
            console.error("Query error:", err.message);
            throw err;
        }
    }

    classify(transaction) {
        let tags = this.applyTagsToTransaction(transaction)
        // if (tags.length > 0) {
        let t = { ...transaction }
        delete t.jsondata;
        // console.log(t)
        // console.log(`tags for ${t.id}:`, tags)
        // console.log("\n")
        // }
        return tags
    }

    // server.js currently only calls this.
    classifyId(id) {
        let transactionDoc = this.fetchTransactionFromDatabase(id)
        let tags = this.classify(transactionDoc)

        const unique = [...new Set(tags)];
        if (unique.length > 0) {
            this.saveTagsToDatabase(id, unique)
        }
    }


    parseRule(rule) {
        // Split the rule into components (field, operator, value)
        if (this.ruleComponents[rule]) {
            return this.ruleComponents[rule]
        } else {
            // split 
            //    amount: >50 ; description : blah \n account: 12345
            // into
            //        { amount: ">50", "description": "blah", "account": "12345"}
            const components = rule.split(/\s*[;\n]\s*/).map(component => {
                const [field, pattern] = component.split(/\s*:\s*/).map(str => str.trim());
                return { field, pattern };
            });
            return this.ruleComponents[rule] = components;
        }
    }

    checkTransaction(transaction, ruleComponents) {
        return ruleComponents.every(({ field, pattern }) => {

            // Handle NOT
            if (pattern.startsWith('<>')) {
                return !(new RegExp(pattern.slice(2), "i").test(transaction[field]));
            }

            // Handle case sensitivity
            if (pattern.startsWith('!')) {
                return new RegExp(pattern.slice(1)).test(transaction[field]);
            }

            // Handle comparison operators
            else if (pattern.startsWith('>') || pattern.startsWith('<')) {
                const operator = pattern.match(/[><]=?/)[0];
                const value = parseFloat(pattern.split(operator)[1]);

                switch (operator) {
                    case '>':
                        return transaction[field] > value;
                    case '>=':
                        return transaction[field] >= value;
                    case '<':
                        return transaction[field] < value;
                    case '<=':
                        return transaction[field] <= value;
                    default:
                        return false;
                }
            }


            // Handle matching
            if (pattern.startsWith('(')) {
                // if (new RegExp(/coles/i).test(transaction['description'])) {
                //     console.log("here");
                // }
                const matches = transaction[field].matchAll(pattern);
                for (let i = 0; i < matches.length; i++) {

                }
                return (new RegExp(pattern, "i").test(transaction[field]));
            }

            else {
                // Default case-insensitive regex match
                return new RegExp(pattern, 'i').test(transaction[field]);
            }
        });
    }

    applyTagsToTransaction(transaction) {
        let tags = [];

        for (const [rule, ruleTags] of Object.entries(this.transactionRules)) {
            const ruleComponents = this.parseRule(rule);
            // console.log(ruleComponents)
            if (this.checkTransaction(transaction, ruleComponents)) {
                tags = tags.concat(ruleTags);
                // console.log("Matched!", rule)
                // console.log("   returning tags:", tags)
            }
        }
        return tags;
    }

}

module.exports = RulesClassifier;
