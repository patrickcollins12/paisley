const BankDatabase = require('./BankDatabase');
const config = require('./Config');

class RulesClassifier {

    constructor() {
        this.db = new BankDatabase();
        this.ruleComponents = {}
        this.transactionRules = require(config['rules']);
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

    classifyId(id) {
        let transactionDoc = this.fetchTransactionFromDatabase(id)
        let tags = this.classify(transactionDoc)
        // if (tags.length > 0) {
        //     this.saveTagsToDatabase(id,uniqueTags)
        // }
        
        const uniqueTags = arr => [...new Set(arr)];
        const unique = uniqueTags(tags);
        if (unique.length > 0) {
            this.saveTagsToDatabase(id,unique)
        }
        
    }

    loadRules() {
        // this.rules = rules.transactionRules
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

            // Handle case sensitivity
            if (pattern.startsWith('!')) {
                return new RegExp(pattern.slice(1)).test(transaction[field]);
            }

            // Handle comparison operators
            else if (pattern.includes('>') || pattern.includes('<')) {
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

            // Handle NOT
            if (pattern.startsWith('^')) {
                return !(new RegExp(pattern.slice(1), "i").test(transaction[field]));
            }

            // Handle matching
            if (pattern.startsWith('(')) {
                if (new RegExp(/coles/i).test(transaction['description'])) {
                    console.log("here");
                }
                const matches = transaction[field].matchAll(pattern);
                for (let i=0; i < matches.length; i++ ) {
                    
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
