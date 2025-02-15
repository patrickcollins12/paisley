const util = require('../src/ScraperUtil');
const config = require('../src/Config');
config.load()
const BankDatabase = require('../src/BankDatabase'); // Adjust the path as necessary
let db = new BankDatabase();

// clear account history!
// db.db.prepare("delete from account_history").run();

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

// query.all("swyftx%").forEach(row => {
//     const bits = JSON.parse(row.jsondata).description.split(' ')

//     const datetime = row.datetime
//     const balance = row.balance
//     const units = bits[1]
//     const asset = bits[2]
//     const accountid = `${row.account} ${asset}`
//     const currency = bits[5]
//     const price = bits[4].replace('$', '')

//     const data = {
//         "accountid": accountid,
//         "balance": balance,
//         "datetime": datetime,
//         // "data": JSON.stringify(filejson)
//         "data": {
//             "units": units,
//             "price": price,
//             "asset": asset,
//             "currency": currency,
//             "original": row.jsondata
//         }
//     }

//     console.log(JSON.stringify(data, null, 2))

//     util.saveToPaisley(
//         "/api/account_balance",
//         data
//     )
// })
