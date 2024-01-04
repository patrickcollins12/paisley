const BankDatabase = require('./BankDatabase');
// const config = require('./Config');

const transactionRules = {

    // "description : !Salary | Expenses": 
    //     ["Income"],

    "description : SCW Expenses ; account : 123456 ; amount: <50 ":
        ["Secure Code Warrior", "123456"],

    // "description : grocery": 
    //     ["Food > Groceries"],

    // "description : SCW Expenses; account : ^123456$ ; date:>2023-04 ": 
    //     ["Secure Code Warrior", "Expenses Reimbursement"],

    // "description : amzn | amazon ; description : prime": 
    //     ["Amazon (merchant)", "Subscription"],

    // "description: amznprime | amazon prime": 
    //     ["Amazon (merchant)", "Entertainment > Subscription"],
};

class Classifier {

    constructor() {
        this.db = new BankDatabase();
    }

    classify(id) {
        let result = this.applyTagsToTransaction(transaction, transactionRules)
        // console.log(result);    
    }

    parseRule(rule) {
        // Split the rule into components (field, operator, value)
        const components = rule.split(/\s*[;\n]\s*/).map(component => {
            const [field, pattern] = component.split(/\s*:\s*/).map(str => str.trim());
            return { field, pattern };
        });
        return components;
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
            else {
                // Default case-insensitive regex match
                return new RegExp(pattern, 'i').test(transaction[field]);
            }
        });
    }

    applyTagsToTransaction(transaction, transactionRules) {
        let tags = [];
        for (const [rule, ruleTags] of Object.entries(transactionRules)) {
            const ruleComponents = this.parseRule(rule);
            // console.log(ruleComponents)
            if (this.checkTransaction(transaction, ruleComponents)) {
                tags = tags.concat(ruleTags);
                console.log("Matched!", rule)
                console.log("   returning tags:", tags)
            }
        }
        return tags;
    }

}

module.exports = Classifier;
