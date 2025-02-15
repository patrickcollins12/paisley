import { test, expect } from '@playwright/test';
const util = require('../src/ScraperUtil');
const axios = require('axios').default;
const config = require('../src/Config');
config.load()
const bank_config = config['RestSuperScraper'];
// const path = require('path');
const { DateTime } = require("luxon");
const logger = require('../src/Logger');


test('test', async ({ page }) => {
    test.slow();
    // return;

    // DEBUG=true npx test
    let DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

    let userName = bank_config['Username']
    let password = bank_config['Password']

    let url = (DEBUG) ?
        'http://localhost:8080/rest_super.html' :
        'https://rest.com.au/';

    await page.goto(url);

    if (!DEBUG) {
        await page.getByRole('button', { name: 'Login N' }).click();
        await page.getByRole('link', { name: ' Member login' }).click();
        await page.getByRole('textbox').fill(userName);
        await page.getByRole('textbox').press('Enter');
        await page.locator('input[type="password"]').fill(password);
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.getByRole('button', { name: 'Go to Member Access' }).click();
    }

    // Get the balance
    /*
    <div id="currentBalanceText">
        Your Current Balance as at 27/12/2023 is:
    </div>
    <div id="prominentCurrentBalance">
        $509,148.03
    </div>
    */
    await expect(page.getByText('Your Current Balance as at')).toBeVisible({ timeout: 60000 });
    let rawBalance = await page.locator('#prominentCurrentBalance').innerText();
    let cleanBalance = util.cleanPrice(rawBalance);

    const dated = DateTime.now().setZone("Australia/Sydney").toISODate();

    let data = {
        'accountid': bank_config['account'],
        'datetime': DateTime.now().setZone("Australia/Sydney"),
        'balance': cleanBalance
    }

    logger.info(JSON.stringify(data, null, 2))
    saveToPaisley("/api/account_balance", data)
    
});

////////////////////////
// TODO move this to a common file out of swyftx, coinbase and rest_super
//Save to paisley account_history the balance
async function saveToPaisley(path, payload) {
    try {

        const url = `${config['paisleyUrl']}${path}`
        // logger.info(`Calling URL: ${url} with payload:\n ${JSON.stringify(payload, null, 2)}`)

        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': config['paisleyApiKey'],
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
