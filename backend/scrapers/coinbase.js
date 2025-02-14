import { test } from '@playwright/test';
const { sign } = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Converts a human-readable timezone from Coinbase to a valid IANA timezone.
 *
 * Coinbase's API returns timezone names in a human-readable format (e.g., "Pacific Time (US & Canada)"),
 * but most libraries (like Luxon and Moment.js) require IANA timezones (e.g., "America/Los_Angeles").
 *
 * ## Updating the Timezone Map:
 * - This `timezoneMap` contains known mappings from Coinbase's format to IANA format.
 * - If Coinbase introduces new timezones, update this map accordingly.
 * - Log unknown timezones for monitoring.
 *
 * ## Fallback Behavior:
 * - If an unknown timezone is encountered, a warning is logged.
 * - The function returns `"UTC"` as a safe default.
 */
const timezoneMap = {
    "Pacific Time (US & Canada)": "America/Los_Angeles",
    "Eastern Time (US & Canada)": "America/New_York",
    "Central Time (US & Canada)": "America/Chicago",
    "Mountain Time (US & Canada)": "America/Denver",
    // "Central European Time (CET)": "Europe/Berlin",
    // "Eastern European Time (EET)": "Europe/Bucharest",
    // Add more as needed
};


// Coinbase Scraper needs a configuration which looks like the following:
//     /////////
//     // Coinbase
//     CoinbaseScraper: {
//       // Coinbase API credentials
//       "keyName": 'organizations/06xxxxxxx-a92f-4xx9-axxc-xxxxxxxx/apiKeys/a5ccccca-xxxx-xxxx-xxxx-a3xxxxxxxxxxx7a',
//       "keySecret": `-----BEGIN EC PRIVATE KEY-----
//                      MHcCAxxxxxxxx/feSonxxxx/Mdxxxx/QHP2xxxxxx+rNUycFF0i8oAxxxxxxxxxx
//                      AwEHoUQDQgAxxxxxxxxx/XBJIi2Uxxxxxxxxxxxxxxxxxxxxx/6xxk+X
//                      jxxxxxxxxxxxxxC/KxxxxJR+8cxxxxxxgC/yxxxw==
//                      -----END EC PRIVATE KEY-----`
//   },

const config = (require('../src/Config'));
config.load()

const bank_config = config['CoinbaseScraper'];

let keyName = bank_config['keyName']
let keySecret = bank_config['keySecret']

let paisleyUrl = config['paisleyUrl']
let paisleyApiKey = config['paisleyApiKey']

////////////////////////
async function createOrUpdateMainAccount() {
    let account_from_user_payload = {}
    try {

        // call /v2/user to create the main Coinbase account
        // this API is not deprecated according to this discord 
        // chat: https://discord.com/channels/1220414409550336183/1220417437921443861/1339103373588299776
        const raw_data = await callCoinbase('/v2/user')
        // sample from the /v2/user coinbase api, this is not used
        const sample_data_test = {
            "data": {
                "id": "9e8082b3-xxxx-576b-xxxx-25ca8604da30",
                "name": "Patrick Collins",
                "avatar_url": "https://images.coinbase.com/avatar?h=5977xxxx8%2Bt9Su2uEvm6xxxxxxxxxxxx6s7CPqu%0AvcNa&s=128",
                "resource": "user",
                "resource_path": "/v2/user",
                "time_zone": "Pacific Time (US & Canada)",
                "native_currency": "AUD",
                "bitcoin_unit": "BTC",
                "country": {
                    "code": "AU",
                    "name": "Australia"
                },
                "created_at": "2017-07-25T16:40:39Z",
                "email": "pxxxxxxxxxx@gmail.com"
            }
        }
        // selectively move it over to payload
        const user_data = raw_data.data
        // console.log(`User data: ${JSON.stringify(user_data, null, 2)}`)
        account_from_user_payload = {
            "id": user_data.id,
            "institution": "Coinbase",
            "name": "Coinbase", // account name
            "holders": user_data.name,
            "currency": user_data.native_currency,
            "type": "crypto",
            "timezone": convertToIanaTimezone(user_data.time_zone),
            "shortname": "Coinbase",
            // "parentid": null,
            "metadata": JSON.stringify(user_data)
        }

        // Note this is an upsert operation, so will overwrite the existing account 
        // if has been modified manually.
        savePaisleyAccount(account_from_user_payload)
            // .then(response => console.log("API Response:", response))
            .catch(error => console.error("Error:", error));
    } catch (error) {
        console.error('Failed to fetch data:', error.message);
    }

    return account_from_user_payload
}

// Get all accounts from the brokerage API
// Filter those with a +ve balance, then
// Save it to the paisley account API
async function getCoinbaseBalances(account_from_user_payload) {
    try {

        const data = await callCoinbase('/api/v3/brokerage/accounts');
        const filteredAccounts = data.accounts.filter(account => {
            const balance = parseFloat(account.available_balance.value);
            return balance > 0;
        });

        // sample from the /api/v3/brokerage/accounts coinbase api, this is not used
        const sample_account = {
            uuid: 'd949e546-ca3f-5bd8-8a2e-b3f1547d9edd',
            name: 'BTC Wallet',
            currency: 'BTC',
            available_balance: { value: '0.17352111', currency: 'BTC' },
            default: true,
            active: true,
            created_at: '2017-07-25T16:40:40.054Z',
            updated_at: '2022-11-16T08:49:48.334Z',
            deleted_at: null,
            type: 'ACCOUNT_TYPE_CRYPTO',
            ready: true,
            hold: { value: '0', currency: 'BTC' },
            retail_portfolio_id: '9e8082b3-fdb5-576b-b1cb-25ca8604da30',
            platform: 'ACCOUNT_PLATFORM_CONSUMER'
        }

        for (const account of filteredAccounts) {
            try {
                const payload = {
                    "id": account.uuid,
                    "institution": "Coinbase",
                    "name": account.name,
                    "holders": account_from_user_payload.holders,
                    "currency": account_from_user_payload.currency,
                    "type": "crypto",
                    "status": (account.active === true) ? "active" : "inactive",
                    "timezone": account_from_user_payload.timezone,
                    "shortname": "Coinbase " + account.currency, // Coinbase BTC
                    "parentid": account_from_user_payload.id,
                    "metadata": JSON.stringify(account)
                };

                // console.log(`Payload: ${JSON.stringify(payload, null, 2)}`)
                savePaisleyAccount(payload)
                    // .then(response => console.log("API Response:", response))
                    .catch(error => console.error("Error:", error));

                const cryptocode = account.currency
                const currency = account_from_user_payload.currency
                const spotpriceJson = await callCoinbase(`/v2/prices/${cryptocode}-${currency}/spot`);

                const price = spotpriceJson.data.amount;
                const balance = (price * parseFloat(account.available_balance.value)).toFixed(2);
                console.log(`Account: ${cryptocode}-${currency} \$${balance}\t\t(Volume held:${account.available_balance.value}, Spot price:${parseFloat(price).toFixed(3)})`);

                savePaisleyBalance( {
                    "accountid": account.uuid,
                    "datetime": new Date().toISOString(),
                    "balance": balance,
                    "data": {
                            "code": cryptocode,
                            "currency": currency,
                            "spotprice": price
                        }
                    
                })

                // const spotprice2 = await callCoinbase(`/v2/prices/${code}-AUD/spot`);
                // const price2 = spotprice2.data.amount;
                // console.log(`Account: ${uuid} ${code}-AUD \$${(price2 * value).toFixed(2)}\t\t(Volume held:${value}, Spot price:${parseFloat(price2).toFixed(3)})`);
            } catch (error) {
                console.error('Failed to fetch data:', error.message);
            }

            // console.log(JSON.stringify(data2.data, null, 2));

            // x.push(account)
        }

    } catch (error) {
        console.error('Failed to fetch data:', error.message);
    }

}


/**
 * Save Coinbase data to the account API (Paisley) by updating only the metadata field.
 * 
 * @param {Object} payload - The request payload
 */
async function savePaisleyAccount(payload) {
    try {
        const url = `${paisleyUrl}/api/accounts/${payload.id}`
        console.log(`Calling URL: ${url}`)

        // Send a PUT request to update only the metadata field
        const response = await axios.put(url, payload, {
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

/**
 * Save Coinbase data to the account API (Paisley) by updating only the metadata field.
 * 
 * @param {Object} payload - The request payload
 * @param {string} paisleyUrl - The base URL of the Paisley API
 * @param {string} paisleyApiKey - The API key for authentication
 */
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

async function callCoinbase(requestPath) {
    try {
        // Generate JWT
        const requestMethod = 'GET';
        const uri = `${requestMethod} api.coinbase.com${requestPath}`;
        const token = sign(
            {
                iss: 'cdp',
                nbf: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 120, // Valid for 2 minutes
                sub: keyName,
                uri,
            },
            keySecret,
            {
                algorithm: "ES256",
                header: {
                    kid: keyName,
                    nonce: crypto.randomBytes(16).toString('hex'),
                },
            }
        );

        // Make the API request
        const apiUrl = `https://api.coinbase.com${requestPath}`;
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Return JSON response
        return response.data;
    } catch (error) {
        console.error('Error calling Coinbase API:', error.response?.data || error.message);
        throw error;
    }
}


function convertToIanaTimezone(humanReadableTz) {
    const ianaTz = timezoneMap[humanReadableTz];

    if (!ianaTz) {
        console.warn(`⚠️ Unknown timezone received: "${humanReadableTz}". Defaulting to UTC.`);
        return "UTC"; // Safe fallback
    }

    return ianaTz;
}


test('test', async () => {
    let account_from_user_payload = await createOrUpdateMainAccount()
    let data = await getCoinbaseBalances(account_from_user_payload)
});

