import { test } from '@playwright/test';
const { sign } = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

// TODO.
// Dynamically consider adding and removing of assets. How to add the parent account etc.
// How to infer the currency? What currency to store it in?
// create an account_history route api
// Fetch the spot price in that currency, then save the price in account_history.





// Coinbase Scraper needs a configuration which looks like the following:
//     /////////
//     // Coinbase
//     CoinbaseScraper: {
//       // Coinbase API credentials
//       "keyName": 'organizations/06xxxxxxx-a92f-4xx9-axxc-xxxxxxxx/apiKeys/a5ccccca-xxxx-xxxx-xxxx-a3xxxxxxxxxxx7a',
//       "keySecret": `-----BEGIN EC PRIVATE KEY-----
// MHcCAxxxxxxxx/feSonxxxx/Mdxxxx/QHP2xxxxxx+rNUycFF0i8oAxxxxxxxxxx
// AwEHoUQDQgAxxxxxxxxx/XBJIi2Uxxxxxxxxxxxxxxxxxxxxx/6xxk+X
// jxxxxxxxxxxxxxC/KxxxxJR+8cxxxxxxgC/yxxxw==
// -----END EC PRIVATE KEY-----`
//   },

const config = (require('../src/Config'));
config.load()

const bank_config = config['CoinbaseScraper'];

let keyName = bank_config['keyName']
let keySecret = bank_config['keySecret']

let paisleyUrl = config['paisleyUrl']
let paisleyApiKey = config['paisleyApiKey']

async function getCoinbaseBalances() {
    console.log(`paisleyUrl: ${paisleyUrl}`)
    console.log(`paisleyApiKey: ${paisleyApiKey}`)

    try {
        const data = await callCoinbase('/api/v3/brokerage/accounts');
        const filteredAccounts = data.accounts.filter(account => {
            const balance = parseFloat(account.available_balance.value);
            return balance > 0;
        });

        // console.log(JSON.stringify(data, null, 2));

        for (const account of filteredAccounts) {
            const uuid = account.uuid
            const code = account.available_balance?.currency
            const value = account.available_balance?.value

            // console.log(`Account: ${JSON.stringify(account, null, 2)}`)
            saveDataToPaisley(account, paisleyUrl, paisleyApiKey)
                .then(response => console.log("API Response:", response))
                .catch(error => console.error("Error:", error));
            
            try {

                const spotprice = await callCoinbase(`/v2/prices/${code}-USD/spot`);

                const price = spotprice.data.amount;
                console.log(`Account: ${uuid} ${code}-USD \$${(price * value).toFixed(2)}\t\t(Volume held:${value}, Spot price:${parseFloat(price).toFixed(3)})`);

                const spotprice2 = await callCoinbase(`/v2/prices/${code}-AUD/spot`);
                const price2 = spotprice2.data.amount;
                console.log(`Account: ${uuid} ${code}-AUD \$${(price2 * value).toFixed(2)}\t\t(Volume held:${value}, Spot price:${parseFloat(price2).toFixed(3)})`);
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
 * @param {Object} coinbaseData - The Coinbase account data
 * @param {string} paisleyUrl - The base URL of the Paisley API
 * @param {string} paisleyApiKey - The API key for authentication
 */
async function saveDataToPaisley(coinbaseData, paisleyUrl, paisleyApiKey) {
    try {
        // Extract metadata fields from Coinbase data
        const metadata = {
            available_balance: coinbaseData.available_balance?.value,
            currency: coinbaseData.currency,
            default: coinbaseData.default,
            active: coinbaseData.active,
            created_at: coinbaseData.created_at,
            updated_at: coinbaseData.updated_at,
            hold: coinbaseData.hold.value,
            retail_portfolio_id: coinbaseData.retail_portfolio_id,
            platform: coinbaseData.platform
        };

        // Construct the request payload with only metadata, leaving other fields unchanged
        // const payload = {
        //     metadata: JSON.stringify(metadata) // Store as a JSON string
        // };

        const payload = {
            "metadata": JSON.stringify(coinbaseData) // Store metadata as JSON string
        };

        // {
        //     uuid: 'd949e546-ca3f-5bd8-8a2e-b3f1547d9edd',
        //     name: 'BTC Wallet',
        //     currency: 'BTC',
        //     available_balance: { value: '0.17352111', currency: 'BTC' },
        //     default: true,
        //     active: true,
        //     created_at: '2017-07-25T16:40:40.054Z',
        //     updated_at: '2022-11-16T08:49:48.334Z',
        //     deleted_at: null,
        //     type: 'ACCOUNT_TYPE_CRYPTO',
        //     ready: true,
        //     hold: { value: '0', currency: 'BTC' },
        //     retail_portfolio_id: '9e8082b3-fdb5-576b-b1cb-25ca8604da30',
        //     platform: 'ACCOUNT_PLATFORM_CONSUMER'
        //   }
          
        const accountid = `Coinbase ${coinbaseData.currency}`
        const url = `${paisleyUrl}/api/accounts/${accountid}`

        // Send a PUT request to update only the metadata field
        const response = await axios.put(url, payload, {
            headers: {
                'x-api-key': paisleyApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Successfully updated account metadata:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error saving data to Paisley:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Save Coinbase data to the account API (Paisley)
 * 
 * @param {Object} coinbaseData - The Coinbase account data
 * @param {string} paisleyUrl - The base URL of the Paisley API
 * @param {string} paisleyApiKey - The API key for authentication
 */
async function saveDataToPaisley2(coinbaseData, paisleyUrl, paisleyApiKey) {
    try {
        // Extract relevant data from Coinbase response
        const metadata = {
            available_balance: coinbaseData.available_balance.value,
            currency: coinbaseData.currency,
            default: coinbaseData.default,
            active: coinbaseData.active,
            created_at: coinbaseData.created_at,
            updated_at: coinbaseData.updated_at,
            hold: coinbaseData.hold.value,
            retail_portfolio_id: coinbaseData.retail_portfolio_id,
            platform: coinbaseData.platform
        };

        // Construct the request payload
        const payload = {
            "accountid": "Coinbase BTC",
            "metadata": JSON.stringify(coinbaseData) // Store metadata as JSON string
        };

        console.log(`Payload: ${JSON.stringify(payload, null, 2)}`)

        // Send a PUT request to update the existing account
        const response = await axios.put(`${paisleyUrl}/api/accounts/${coinbaseData.uuid}`, payload, {
            headers: {
                'x-api-key': paisleyApiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Successfully updated account metadata:', response.data);
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


test('test', async () => {

    let data = await getCoinbaseBalances()

    saveDataToPaisley(data, paisleyUrl, paisleyApiKey)

});

