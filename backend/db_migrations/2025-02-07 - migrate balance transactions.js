
const config = require('../src/Config');
config.load()
const BankDatabase = require('../src/BankDatabase'); // Adjust the path as necessary
let db = new BankDatabase();

// clear account history!
db.db.prepare("delete from account_history").run();

const sql = `
select t.account, t.datetime, t.balance, t.jsondata, json_extract(t.jsondata,'$.file') as file
from 'transaction' t where type='BAL' and account like ?
`

const query = db.db.prepare(sql);
query.all("RES010%").forEach(row => {
    console.log(row.account, row.balance)
    const filejson = JSON.stringify( {"file": row.file} )
    const insertstmt = db.db.prepare('INSERT INTO account_history (accountid, datetime, balance, data) VALUES (?, ?, ?, ?)');
    insertstmt.run(row.account, row.datetime, row.balance, filejson);
})

//Bitcoin: 0.019821 BTC @ $158389.97 AUD
query.all("swyftx%").forEach(row => {
    const bits = JSON.parse(row.jsondata).description.split(' ')
    const filejson = {
            "file": row.file,
            "units": bits[1],
            "asset_symbol": bits[2],
            "currency": bits[5],
            "balance": row.balance,
            "price": bits[4].replace('$','')
        }
    console.log(filejson)

    const insertstmt = db.db.prepare('INSERT INTO account_history (accountid, datetime, balance, data) VALUES (?, ?, ?, ?)');
    insertstmt.run("Swyftx "+ filejson.asset_symbol, row.datetime, row.balance, JSON.stringify(filejson));
})
