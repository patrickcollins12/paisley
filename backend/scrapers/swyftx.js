import { test } from '@playwright/test';

const { DateTime } = require("luxon");
const axios = require('axios').default;
// test.describe.configure({ retries: 0 });

const config = (require('../src/Config'));
config.load()

const util = require('../src/ScraperUtil');
const logger = require('../src/Logger');

const bank_config = config['SwyftxScraper'];
let API_Key = bank_config['API_Key']

async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://api.swyftx.com.au/auth/refresh/",
            { apiKey: API_Key });
        return response.data.accessToken;
    } catch (error) {
        logger.error(`Request failed with status ${error.response.status}`);
        logger.error(JSON.stringify(error.response.data, null, 2)); // Pretty print JSON response

    }
}

/**
 * Generic Swyftx API request function with auth
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
        logger.error(`Request to getLiveRates() failed with status ${JSON.stringify(error.response)}`);
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
        "type": "Crypto",
        "timezone": "Australia/Sydney",
        "parentid": bank_config['account']
    };

    await util.saveToPaisley(`/api/accounts`, account_update, asset_account_id);

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

    await util.saveToPaisley("/api/account_balance", account_history);
}

test('test', async () => {
    await apiCallsToSwyftx()
});