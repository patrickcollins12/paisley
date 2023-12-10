const sqlite3 = require('sqlite3').verbose();

class BankDatabase {

    constructor(dbfile) {
        this.dbfile = dbfile || './transactions.db';

        //   let db = new sqlite3.Database(':memory:');
        this.db = new sqlite3.Database(this.dbfile, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
            console.log('Connected to the SQLite database.');
        });  
    }

}

module.exports = BankDatabase;