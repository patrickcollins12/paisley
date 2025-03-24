import { test } from '@playwright/test';
const { sign } = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { DateTime } = require("luxon");
const util = require('../src/ScraperUtil');
const logger = require('../src/Logger');

/**
 * HEY! You need to do something here if you're a Coinbase customer not in the US.
 *
 * Coinbase's API returns silly timezone names in a human-readable format (e.g., "Pacific Time (US & Canada)"),
 * but most libraries (like Luxon and Moment.js) require IANA timezones (e.g., "America/Los_Angeles").
 *
 * ## You need to update this Timezone Map. Find what timezone Coinbase puts in their request response and update this map accordingly.
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
        // logger.info(`User data: ${JSON.stringify(user_data, null, 2)}`)
        account_from_user_payload = {
            "accountid": user_data.id,
            "institution": "Coinbase",
            "name": "Coinbase", // account name
            "holders": user_data.name,
            "currency": user_data.native_currency,
            "type": "Crypto",
            "timezone": convertToIanaTimezone(user_data.time_zone),
            "shortname": "Coinbase",
            // "parentid": null,
            "metadata": JSON.stringify(user_data)
        }

        // Note this is an upsert operation, so will overwrite the existing account 
        // if has been modified manually.
        await util.saveToPaisley("/api/accounts", account_from_user_payload)

    } catch (error) {

        if (error.response && error.response.status === 400 && error.response.data?.message?.includes("Account ID already exists")) {
            logger.info("Account already exists, continuing happily...");
        } else {
            logger.info(`${error.message}`);
            throw error;
        }
    }

    return account_from_user_payload
}

////////////////////////
// Get all accounts from the brokerage API
// Filter those with a +ve balance, then
// Save it to the paisley account API
async function getCoinbaseBalances(account_from_user_payload) {
    try {

        // currenciesResponse
        {
            data: [
                {
                    asset_id: '5b71fc48-3dd3-540c-809b-f8c94d0e68b5',
                    code: 'BTC',
                    name: 'Bitcoin',
                    color: '#F7931A',
                    sort_index: 100,
                    exponent: 8,
                    type: 'crypto',
                    address_regex: '^([13][a-km-zA-HJ-NP-Z1-9]{25,34})|^(bc1[pqzry9x8gf2tvdw0s3jn54khce6mua7l]([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}|[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58}))$'
                },
                {
                    asset_id: 'd85dce9b-5b73-5c3c-8978-522ce1d1c1b4',
                    code: 'ETH',
                    name: 'Ethereum',
                    color: '#627EEA',
                    sort_index: 101,
                    exponent: 8,
                    type: 'crypto',
                    address_regex: '^(?:0x)?[0-9a-fA-F]{40}$'
                },
            ]
        }
        const currenciesResponse = await callCoinbase('/v2/currencies/crypto');
        const currencies = currenciesResponse.data;

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
                // lookup the currency name in currencies
                const currencyName = currencies?.find(c => c.code === account.currency)?.name || account.currency;
                logger.info(`Found currency name for ${account.currency}: ${currencyName}`);

                const payload = {
                    "accountid": account.uuid,
                    "institution": "Coinbase",
                    "name": account.name,
                    "holders": account_from_user_payload.holders,
                    "currency": account_from_user_payload.currency,
                    "type": "Crypto",
                    "status": (account.active === true) ? "active" : "inactive",
                    "timezone": account_from_user_payload.timezone,
                    "shortname": currencyName, // Bitcoin, Ethereum, etc.
                    "parentid": account_from_user_payload.accountid,
                    "metadata": JSON.stringify(account)
                };

                // logger.info(`parentid: ${JSON.stringify(account_from_user_payload, null, 2)}`)
                // logger.info(`Payload: ${JSON.stringify(payload, null, 2)}`)
                await util.saveToPaisley("/api/accounts", payload, account.uuid)

                const cryptocode = account.currency
                const currency = account_from_user_payload.currency
                const spotpriceJson = await callCoinbase(`/v2/prices/${cryptocode}-${currency}/spot`);
                const units = parseFloat(account.available_balance.value)
                const price = parseFloat(spotpriceJson.data.amount)
                const balance = (price * units).toFixed(2)
                logger.info(`Account: ${cryptocode}-${currency} \$${balance}\t\t(Units:${units}, Spot price:${price.toFixed(3)})`)

                const datetime = DateTime.now().setZone(payload.timezone).toISO()

                logger.info(`Datetime: ${datetime}, timezone: ${payload.timezone}`)

                util.saveToPaisley(
                    "/api/account_balance/",
                    {
                        "accountid": account.uuid,
                        "datetime": datetime,
                        "balance": balance,
                        "data": {
                            "code": cryptocode,
                            "units": units,
                            "currency": currency,
                            "price": price,
                            "timezone": payload.timezone,
                        }

                    })

            } catch (error) {
                logger.error(`Failed to fetch data: ${error.message}`);
            }

            // logger.info(JSON.stringify(data2.data, null, 2));

            // x.push(account)
        }

    } catch (error) {
        logger.error(`Failed to fetch data: ${error.message}`);
    }

}

////////////////////////
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
        
        logger.error(`Error calling Coinbase API: ${error.response?.data || error.message}`);
        throw error;
    }
}

////////////////////////
function convertToIanaTimezone(humanReadableTz) {
    const ianaTz = timezoneMap[humanReadableTz];

    if (!ianaTz) {
        logger.warn(`⚠️ Unknown timezone received: "${humanReadableTz}". Defaulting to UTC.`);
        return "UTC"; // Safe fallback
    }

    return ianaTz;
}

////////////////////////
// MAIN
test('test', async () => {
    let account_from_user_payload = await createOrUpdateMainAccount()
    let data = await getCoinbaseBalances(account_from_user_payload)
});

