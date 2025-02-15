import { test } from '@playwright/test';

// const util = require('../src/ScraperUtil');
// const path = require('path');
const config = (require('../src/Config'));
const { DateTime } = require("luxon");
const axios = require('axios').default;
test.describe.configure({ retries: 0 });

config.load()

const logger = require('../src/Logger');

logger.info('Application started');
logger.warn('This is a warning message');
logger.error('Something went wrong!');

// exit the test
process.exit(1);

let paisleyUrl = config['paisleyUrl']
let paisleyApiKey = config['paisleyApiKey']

const bank_config = config['SwyftxScraper'];
let API_Key = bank_config['API_Key']


async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://api.swyftx.com.au/auth/refresh/",
            { apiKey: API_Key });
        return response.data.accessToken;
    } catch (error) {
        // console.log(error);
        console.error(`Request failed with status ${error.response.status}`);
        console.error(JSON.stringify(error.response.data, null, 2)); // Pretty print JSON response

    }
}

async function getBalance(accessToken) {

    if (!accessToken) {
        console.error("getAccessToken() returned undefined. Cannot proceed.");
        return;
    }

    try {
        const response = await axios.get(
            "https://api.swyftx.com.au/user/balance/", {
            "headers": {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error(`Request failed with status ${error.response.status}`);
        console.error(JSON.stringify(error.response.data, null, 2)); // Pretty print JSON response
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
        // console.log(error);
    }
}

async function apiCallsToSwyftx() {
    let balances = await getBalance(await getAccessToken())
    let rates = await getLiveRates()

    balances?.filter(b => parseFloat(b.availableBalance) > 0)
        .forEach(ownedAsset => {
            let id = ownedAsset["assetId"]
            console.log(`ownedAsset: ${JSON.stringify(ownedAsset)}`)

            let units = parseFloat(ownedAsset["availableBalance"]) // 0.01982
            let name = rates[id]["name"]  // Bitcoin
            let asset = rates[id]["code"] // BTC
            let price = parseFloat(rates[id]["sell"]) // 150200.78267905
            let balance = price * units // 2332.62

            let entry = {
                'datetime': DateTime.now().setZone("Australia/Sydney").toISO(),
                "accountid": bank_config['account'],
                "balance": balance.toFixed(2),
                "data": {
                    "description": `${asset}: ${units} ${asset} @ $${price} AUD`,
                    "asset": code,
                    "name": name,
                    "units": units,
                    "price": price,
                    "currency": "AUD"
                }
            }

            console.log(entry)
            // savePaisleyBalance(entry)

        });

}

test('test', async () => {

    let data = await apiCallsToSwyftx()
    // console.log(data)
    // // setup the csv filename
    // // this is the old code that used to save to CSV
    // const dated = DateTime.now().setZone("Australia/Sydney").toISODate();
    // let fn = `${bank_config['identifier']}_balance_${dated}.csv`
    // let outCSVFile = path.join(config['csv_watch'], fn);
    // await util.saveDataToCSV(outCSVFile, data);
    // const oldCSVFormat = {
    //     datetime: '2025-02-15T13:31:45.679+11:00',
    //     account: 'swyftx_pcollins1',
    //     description: 'Bitcoin: 0.019821 BTC @ $153049.68 AUD',
    //     balance: '3033.54',
    //     type: 'BAL'
    // }


});


////////////////////////
//Save to paisley account_history the balance

async function savePaisleyBalance(payload) {
    try {

        const url = `${paisleyUrl}/api/account_balance/`
        console.log(`Calling URL: ${url}`)

        // Send a PUT request to update only the metadata field
        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': paisleyApiKey,
                'Content-Type': 'application/json'
            }
        });

        // console.log('Successfully updated account metadata:', response.data);
        return response.data;

    } catch (error) {
        console.error('Error saving data to Paisley:', error.response?.data || error.message);
        throw error;
    }
}