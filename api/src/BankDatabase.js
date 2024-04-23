const Database = require('better-sqlite3');
const config = require('./Config');
const fs = require('fs');


class BankDatabase {

    // if no dbPath if provided, it will load from the config and return a singleton.
    // if you provide a dbPath, it will give you a new BankDatabase Object.
    constructor(dbPath = null) {
        if (!dbPath && BankDatabase.singletonInstance) {
            return BankDatabase.singletonInstance;
        }
        const path = dbPath || config.database;
        try {
            if (path == ":memory:") {
                // great, let's proceed
            }

            // if file based, check the path exists
            else if (!fs.existsSync(path)) {
                // TODO, replace this with a default new empty paisley database
                throw new Error(`Database file not found at path: ${path}`);
            }

            // this.db = new Database(path, {verbose: console.log});
            this.db = new Database(path);
            this.addRegex()
            console.log(`Connected to SQLite database: ${path}`);
        } catch (err) {
            console.error("Connect error: ", err.message);
        }

        if (!dbPath) {
            BankDatabase.singletonInstance = this;
        }
    }

    // TODO, make case insensitivity
    addRegex() {
        // Define the REGEXP function
        this.db.function('REGEXP', (pattern, value) => {
            // Try to create a RegExp object and test the value
            try {
                const regex = new RegExp(pattern, 'i');
                return regex.test(value) ? 1 : 0;
            } catch (e) {
                // In case of an invalid regex pattern, return 0
                return 0;
            }
        });
    }

    static allTransactionsSizeQuery = `
        SELECT count(id) as cnt
        FROM 
        ( select 
            t.id as id,
            t.description as description,
            te.description as revised_description,
            CASE
                WHEN t.tags = '' OR t.tags IS NULL THEN ''
                ELSE t.tags
            END AS tags,
            te.tags AS manual_tags
            from 
            'transaction' t
            LEFT JOIN 'transaction_enriched' te ON t.id = te.id
        )
        WHERE 1 = 1 
        `

    static allTransactionsQuery = `
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
        WHERE 1=1
        `

}

// Singleton instance is not created until the first call without a path
module.exports = BankDatabase;