// // system imports
// const express = require('express');
// const app = express();
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const os = require('os');
// const path = require('path');

// local imports
const config = require('./Config');
const RulesClassifier = require('./RulesClassifier');
const BankDatabase = require('./BankDatabase');

async function doit() {
    classifier = new RulesClassifier()
    await classifier.loadRules()
    let db = new BankDatabase();
    
    const query = 'SELECT id FROM "transaction"';
    let result = db.db.prepare(query).all();
    
    for (let record of result) {
        let id = record['id']
        // console.log("here>> ", id)
        const classificationResult = await classifier.classifyId(id);
    }    
}

doit()