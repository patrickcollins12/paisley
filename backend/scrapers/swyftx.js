import { test } from '@playwright/test';

// const util = require('../src/ScraperUtil');
// const path = require('path');
const { DateTime } = require("luxon");
const axios = require('axios').default;
test.describe.configure({ retries: 0 });

const config = (require('../src/Config'));
config.load()

const logger = require('../src/Logger');

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
        logger.error(`Request failed with status ${error.response.status}`);
        logger.error(JSON.stringify(error.response.data, null, 2)); // Pretty print JSON response

    }
}

/**
 * Generic API request function
 * @param {string} endpoint - The API endpoint (e.g., "/user/balance/")
 * @param {string} accessToken - The authentication token
 * @returns {Promise<object|null>} - The API response data or null on failure
 */
async function apiRequest(endpoint, accessToken) {
    if (!accessToken) {
        logger.error("getAccessToken() returned undefined. Cannot proceed.");
        return null;
    }

    try {
        const url = `https://api.swyftx.com.au${endpoint}`
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        logger.info(`Successfully called ${url}`);
        return response.data;
    } catch (error) {
        logger.error(`Request to ${endpoint} failed with status ${error.response?.status || 'Unknown'}`);
        logger.error(JSON.stringify(error.response?.data || "No response data", null, 2));
        return null; // Return null instead of undefined for clarity
    }
}


async function getLiveRates() {
    try {
        const url = "https://api.swyftx.com.au/markets/info/basic/"
        const response = await axios.get(url);
        logger.info(`Successfully called ${url}`);

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
    const accessToken = await getAccessToken();
    if (!accessToken) {
        logger.error("Failed to retrieve access token.");
        return;
    }

    const { balances, user, rates } = await fetchSwyftxData(accessToken);

    // Filter assets with balance > 0 and then process them
    let ownedAssets = balances.filter(b => parseFloat(b.availableBalance) > 0);
    for (const ownedAsset of ownedAssets) {
        await processOwnedAsset(ownedAsset, user, rates);
    }
}

/**
 * Fetch Swyftx balances, user details, and market rates.
 * @param {string} accessToken - Authentication token
 * @returns {Promise<object>} - { balances, user, rates }
 */
async function fetchSwyftxData(accessToken) {
    try {
        let [balances, user, rates] = await Promise.all([
            apiRequest('/user/balance/', accessToken),
            apiRequest('/user/', accessToken),
            getLiveRates()
        ]);

        return { balances, user, rates };
    } catch (error) {
        logger.error("Error fetching Swyftx data:", error.message);
        return { balances: null, user: null, rates: null };
    }
}

/**
 * Process an owned crypto asset and update Paisley.
 * @param {object} ownedAsset - The asset object from Swyftx.
 * @param {object} user - The user object from Swyftx.
 * @param {object} rates - Market rates data.
 */
async function processOwnedAsset(ownedAsset, user, rates) {
    let id = ownedAsset["assetId"];

    let units = parseFloat(ownedAsset["availableBalance"]);
    let name = rates[id]?.name || "Unknown";
    let asset = rates[id]?.code || "Unknown";
    let price = parseFloat(rates[id]?.sell || 0);
    let balance = price * units;
    let asset_account_id = `${bank_config['account']} ${asset}`;
    let asset_name = `Swyftx ${asset}`
    let fullName = `${user.user.profile.name.first} ${user.user.profile.name.last}`
    let currency = user.user.profile.currency.code

    let account_update = {
        "accountid": asset_account_id,
        "institution": "Swyftx",
        "name": asset_name,
        "shortname": asset_name,
        "holders": fullName,
        "currency": currency,
        "type": "crypto",
        "timezone": "Australia/Sydney",
        "parentid": bank_config['account']
    };

    await saveToPaisley(`/api/accounts`, account_update);

    let account_history = {
        'datetime': DateTime.now().setZone("Australia/Sydney").toISO(),
        "accountid": asset_account_id,
        "balance": balance.toFixed(2),
        "data": {
            "description": `${asset}: AUD${balance} (${units} @ $${price})`,
            "asset": asset,
            "name": name,
            "units": units,
            "price": price,
            "currency": "AUD"
        }
    };

    await saveToPaisley("/api/account_balance", account_history);
}

// async function apiCallsToSwyftxOld() {
//     const accessToken = await getAccessToken()

//     let balances = await apiRequest('/user/balance/', accessToken)
//     let ownedAssets = balances?.filter(b => parseFloat(b.availableBalance) > 0) || [];

//     let user = await apiRequest('/user/', accessToken)
//     let rates = await getLiveRates()

//     for (const ownedAsset of ownedAssets) {
//         let id = ownedAsset["assetId"]
//         logger.info(`ownedAsset: ${JSON.stringify(ownedAsset)}`)

//         let units = parseFloat(ownedAsset["availableBalance"]) // 0.01982
//         let name = rates[id]["name"]  // Bitcoin
//         let asset = rates[id]["code"] // BTC
//         let price = parseFloat(rates[id]["sell"]) // 150200.78267905
//         let balance = price * units // 2332.62
//         let asset_account_id = `${bank_config['account']} ${asset}`

//         let account_update = {
//             "accountid": asset_account_id,
//             "institution": "Swyftx",
//             "holders": user.user.profile.name.first + " " + user.user.profile.name.last,
//             "type": "crypto",
//             "timezone": "Australia/Sydney",
//             "shortname": "Swytfx",
//             "parentid": bank_config['account'],
//             // "metadata": JSON.stringify(user.user)
//         }
//         await saveToPaisley(`/api/accounts`, account_update)

//         // update account_history
//         let account_history = {
//             'datetime': DateTime.now().setZone("Australia/Sydney").toISO(),
//             "accountid": asset_account_id,
//             "balance": balance.toFixed(2),
//             "data": {
//                 "description": `${asset}: AUD${balance} (${units} @ $${price})`,
//                 "asset": asset,
//                 "name": name,
//                 "units": units,
//                 "price": price,
//                 "currency": "AUD"
//             }
//         }

//         // logger.info(JSON.stringify(account_history, null, 2))
//         await saveToPaisley("/api/account_balance", account_history)
//     }

// }

////////////////////////
//Save to paisley account_history the balance
async function saveToPaisley(path, payload) {
    try {

        const url = `${paisleyUrl}${path}`
        // logger.info(`Calling URL: ${url} with payload:\n ${JSON.stringify(payload, null, 2)}`)

        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': paisleyApiKey,
                'Content-Type': 'application/json'
            }
        });

        logger.info('Successfully updated account metadata:', response.data);
        return response.data;

    } catch (error) {
        logger.error('Error saving data to Paisley:', error.response?.data || error.message);
        throw error;
    }
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


