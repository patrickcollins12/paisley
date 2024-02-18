// TODO
// [x] subscriptions
// [x] generate some credit amounts very rarely and add refund
// [x] add the other categories, income
// [x] do the transfers
// [x] move the transfer object back onto cats.js. also add description and ruledesc. 
// [x] double check that transfers can't have same account and desc
// [x] create a test pfm directory
// [x] create a csv parser
// [x] load these through serve.js csv importer?? I think so.
// [x] generate the matching rules
// [x] clean up this directory

/*
so the current pipeline was I extracted tags from prod db, fed them into ChatGPT, 
then hardcoded that into cats_generation.js which generated cats.js.
now this file generate_transactions.js takes cats.js only to generate all the transactions
*/

// let cats = require('./cats')
let cats = require('./cats')
const { faker } = require('@faker-js/faker');
const fs = require('fs')
const path = require('path');
const os = require('os');

// Import dayjs and its plugins
const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone');

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

function getRandomDayJSDate() {
    let d = faker.date.recent({ days: 3 * 365 })
    let dj = dayjs(d).startOf('day');
    return dj
}

function formatDate(dt, tz) {
    return dt.format('YYYY-MM-DDTHH:mm:ss') + `${tz}`
}

var accounts = [
    { id: '2134567-9876543', tz: "-0800" },
    { id: '3168970-1234567', tz: "+1000" },
    { id: '1234 8765 0998 7654', tz: "-0300" }
]

var payment_methods = [
    { d: "SQ *", tag: "Square (Payment Method)" },
    { d: "PayPal *", tag: "PayPal (Payment Method)" },
    { d: "Zip *", tag: "Zip (Payment Method)" },
    { d: "AfterPay *", tag: "AfterPay (Payment Method)" }
]

class Merchant {
    constructor(properties) {
        this.transfer = false

        Object.assign(this, properties);

        this.setRandomAccount()
        this.setRandomPaymentMethod()
        this.setRandomLocation()
        this.setRandomTransactionId()
    }

    generateDescription() {
        let description = ""

        if (!this.transfer) {
            description += this.paymentMethod
        }

        description += this.merchantName

        if (this.location) {
            description += " " + this.location
        }

        this.setRandomTransactionId()
        if (this.transactionId) {
            description += " " + this.transactionId
        }

        return description
    }

    setMerchantName(merchantName) {
        this.merchantName = (Math.random() < 0.7) ?
            merchantName.toUpperCase() :
            merchantName
    }

    setTransferName() {
        let transfers = this.descriptions
        let tx1s = transfers[Math.floor(Math.random() * transfers.length)]
        this.transfer_template = tx1s
        this.merchantName = tx1s.replace(/\$TID/g, "T" + faker.finance.pin({ length: 7 }))
        this.transfer = true
    }


    addCategory(cat) {
        if (!this.cats) {
            this.cats = []
        }
        this.cats.push(cat)

    }

    setRandomAccount() {
        let acc = accounts[Math.floor(Math.random() * accounts.length)]
        this.account = acc['id']
        this.tz = acc['tz']
    }

    isCat(catstr) {
        for (const cat of this.cats) {
            if (new RegExp(catstr, "i").test(cat)) {
                return true
            }
        }
        return false
    }


    setRandomQuantityOfTransactions() {
        let t = 10
        if (this.isCat("transfer")) {
            t = 30 // do transfers more frequently
        } else {
            t = 10
        }
        this.quantity = Math.floor(Math.random() * t) + 1
    }


    setRandomPaymentMethod() {
        this.paymentMethod = ""
        if (Math.random() < 0.05) {
            let pm = payment_methods[Math.floor(Math.random() * payment_methods.length)]
            this.paymentMethod = pm['d']
            this.addCategory(pm['tag'])
        }
    }

    setRecurring(recurring) {
        this.recurring = recurring
        if (this.recurring === true) {
            if (Math.random() < 0.3) {
                this.addCategory("Recurring > Subscription")
            } else {
                this.addCategory("Recurring")
            }
        }
    }

    isRecurring() { return this.recurring }


    setRandomLocation() {
        this.location = ""
        if (Math.random() < 0.3) {
            this.location = faker.location.city().toUpperCase() + " " + faker.location.zipCode()
        }
    }

    setRandomTransactionId() {
        this.transactionId = ""
        if (Math.random() < 0.1) {
            this.transactionId = "T" + faker.finance.pin({ length: 7 })
        }
    }

}

class Transaction {
    constructor() {
        this.randomBalance()
    }

    randomBalance() {
        this.balance = faker.finance.amount({ min: 20000, max: 60000 })
        return this.balance
    }
    setAmountSize(size) {
        this.size = size
    }
    setCredit(cbool) {
        this.credit = cbool
    }

    randomlySetRefund() {
        if (Math.random() < 0.005) {
            this.setCredit(true)
        }
    }

    randomAmount() {
        // create amount
        let amount = 100.01
        if (this.size === "xs") {
            amount = faker.finance.amount({ min: 1, max: 10 })
        }
        if (this.size === "s") {
            amount = faker.finance.amount({ min: 11, max: 50 })
        }
        if (this.size === "m") {
            amount = faker.finance.amount({ min: 50, max: 250 })
        }
        if (this.size === "l") {
            amount = faker.finance.amount({ min: 250, max: 1000 })
        }
        if (this.size === "xl") {
            amount = faker.finance.amount({ min: 1000, max: 7000 })
        }

        if (this.credit) {
            this.credit = amount;
            this.debit = 0;
        } else {
            this.credit = 0;
            this.debit = amount;
        }
        return amount
    }

    generateTransactionObject(merchant) {

        if (merchant.recurring && this.date) {
            this.date = this.date.add(1, 'month')
        } else {
            this.date = getRandomDayJSDate()
        }

        if (this.date.isAfter(dayjs())) {
            return null
        }

        let description = merchant.generateDescription()
        let bal = this.randomBalance()
        let cats = JSON.stringify(merchant.cats)
        let dateFormatted = formatDate(this.date, merchant.tz)

        return {
            'datetime': dateFormatted,
            'account': merchant.account,
            'description': description,
            'credit': this.credit,
            'debit': this.debit,
            'balance': bal,
            // 'tags': cats,
        }

        // let str = `${dateFormatted}, ${merchant.account}, ${description}, ${this.credit}, ${this.debit}, ${bal}, ${cats}`
        // console.log(str)

    }
}

function convertAndLogCsv(data) {
    // Check for empty data
    if (data.length === 0) {
        console.log('No data available');
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);
    let rowstr = ""

    rowstr += headers.join(',') + "\n";

    // Log each row
    data.forEach(row => {
        const rowValues = headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`);
        rowstr += rowValues.join(',') + "\n"
    });

    return rowstr
}



// FOREACH ENTRY IN CATS.JS
let finalData = []
for (const [cat, catobj] of Object.entries(cats)) {
    let merchants = catobj['merchants']
    if (!merchants.length) merchants.push('')
    for (const merchantName of merchants) {

        // create the merchant and set it up
        let merchant = new Merchant(catobj)
        merchant.setMerchantName(merchantName)
        merchant.addCategory(cat)
        merchant.setRecurring((catobj['subscription'] === "yes") ? true : false)
        merchant.setRandomQuantityOfTransactions()

        // create the tx and set it up
        let tx = new Transaction();
        tx.setCredit(catobj['credit'] === "yes" ? true : false)
        tx.setAmountSize(catobj['amount'])
        tx.randomlySetRefund();
        for (let i = 0; i < merchant.quantity; i++) {
            tx.randomAmount()

            // special case, do transfers
            if (merchant.isCat('transfer')) {
                merchant.setTransferName()

                // setup the second matching transfer transaction
                let merchant2 = new Merchant(catobj)
                merchant2.setTransferName()
                merchant2.addCategory(cat)

                // keep spinning the dice to get a different account
                while(merchant2.account == merchant.account) {
                    merchant2.setRandomAccount()
                }

                // keep spinning the dice to get a different transfer name
                while(merchant2.transfer_template == merchant.transfer_template) {
                    merchant2.setTransferName()
                }

                // 2nd tx
                let tx2 = new Transaction()
                tx2.credit = tx.debit
                tx2.debit = tx.credit

                let o2 = tx2.generateTransactionObject(merchant2)
                if (o2) finalData.push(o2)

            }
            let o = tx.generateTransactionObject(merchant)
            if (o) finalData.push(o)

        }

    }
}

// GENERATE THE RULES.JS FILE
let finalRules = {}
for (const [cat, catobj] of Object.entries(cats)) {
    let rules = catobj['rules']
    let merchants = catobj['merchants']
    // let catstr = JSON.stringify(cat)

    if (rules) {
        for (const rule of rules) {
            let r = rule.toLowerCase();
            let descstr = `description: ${r}`
            // finalRules.push( { [descstr]: catstr})
            finalRules[descstr] = [cat]
        }
    } 
    
    else if (merchants) {
        for (const merchant of merchants) {
            let m = merchant.toLowerCase();
            let descstr = `description: ${m}`
            let m2 = `${merchant} (Merchant)`
            finalRules[descstr] = [cat,m2]
        }
    }
}

otherTags = {
    "SQ \\*":  "Square (Payment Method)",
    "PayPal \\*": "PayPal (Payment Method)",
    "Zip \\*": "Zip (Payment Method)",
    "AfterPay \\*": "AfterPay (Payment Method)",
}

for (const [rule, cat] of Object.entries(otherTags)) {
    let descstr = `description: ${rule}`
    finalRules[descstr] = [cat]
}


// dump the CSV
let rowcsvstr = convertAndLogCsv(finalData)
let pid = process.pid
const homedir = os.homedir();

let csvfile = path.join(homedir, "paisley/demo/bank_statements", `generic_test_data_${pid}.csv`)
fs.writeFileSync(csvfile, rowcsvstr, 'utf8');

// dump the rules
var rulesstr = "module.exports=\n"+ JSON.stringify(finalRules, null, 2); // spacing level = 2

fs.writeFileSync(path.join(homedir, "paisley/demo", "test_rules.js"), rulesstr, 'utf8');