const Database = require('better-sqlite3');

class BankDatabase {
    constructor(dbfile) {
        this.dbfile = dbfile || './transactions.db';

        try {
            // this.db = new Database(this.dbfile, { verbose: console.log });
            this.db = new Database(this.dbfile);
            console.log('Connected to the SQLite database.');
        } catch (err) {
            console.error("Connect error: ", err.message);
        }
    }

    // // Add your methods for interacting with the database here
    // // Example:
    // getAllTransactions() {
    //     const stmt = this.db.prepare('SELECT * FROM transactions');
    //     return stmt.all();
    // }

    // Add other methods as needed
}


module.exports = BankDatabase;