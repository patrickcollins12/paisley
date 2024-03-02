import { test,expect } from '@playwright/test';
const util = require('../src/ScraperUtil');
const config = (require('../src/Config'));
const { access } = require('fs');
const { DateTime } = require("luxon");
const axios = require('axios').default;
const path = require('path');

config.load()
const bank_config = config['SwyftxScraper'];
let API_Key = bank_config['API_Key']

async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://api.swyftx.com.au/auth/refresh/",
            { apiKey: API_Key });
        return response.data.accessToken;
    } catch (error) {
        console.log(error);
    }
}

async function getBalance(accessToken) {
    try {
        const response = await axios.get(
            "https://api.swyftx.com.au/user/balance/", {
            "headers": {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${accessToken}`
            }
        });

        // [
        //     { assetId: 1, availableBalance: '0', stakingBalance: '0' },
        //     { assetId: 2, availableBalance: '0', stakingBalance: '0' },
        //     { assetId: 3, availableBalance: '0.01982', stakingBalance: '0' }
        //  ]
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

async function getLiveRates() {
    try {
        const response = await axios.get("https://api.swyftx.com.au/markets/info/basic/");
        return response.data.reduce((acc, r) => ({ ...acc, [r["id"]]: r }), {});
        // '3': {
        //     id: 3,
        //     code: 'BTC',
        //     name: 'Bitcoin',
        //     ...
        //     sell: '62200.78267905',
        //   },

    } catch (error) {
        console.log(error);
    }
}

async function apiCallsToSwyftx() {
    let balances = await getBalance(await getAccessToken())
    let rates = await getLiveRates()

    let output = []
    for (const ownedAsset of balances) {
        let id = ownedAsset["assetId"]
        if (rates[id]) {
            let myBalance = rates[id]["sell"] * ownedAsset["availableBalance"] 
            let units = parseFloat(ownedAsset["availableBalance"]).toFixed(6)
            let n = rates[id]["name"]
            let c = rates[id]["code"]
            let p = parseFloat(rates[id]["sell"]).toFixed(2)
            if (myBalance && myBalance > 0) {
                let entry = {
                    'datetime': DateTime.now().setZone("Australia/Sydney").toISO(),
                    "account": bank_config['account'],
                    "description": `${n}: ${units} ${c} @ $${p} AUD`,
                    "balance": myBalance.toFixed(2),
                    "type": "BAL"
                }
                output.push( entry )
            }

        }
    }
    return output
    // console.log(balances)
    // console.log(rates)
}

test('test', async ({ page }) => {

    let data = await apiCallsToSwyftx()

    // setup the csv filename
    const dated = DateTime.now().setZone("Australia/Sydney").toISODate();
    let fn = `${bank_config['identifier']}_balance_${dated}.csv`
    let outCSVFile = path.join(config['csv_watch'], fn);
    
    // console.log(data)

    await util.saveDataToCSV(outCSVFile, data);

});

