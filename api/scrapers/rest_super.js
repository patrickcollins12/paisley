import { test, expect } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../ConfigLoader');
const bank_config = config['RestSuperScraper'];
const path = require('path');
const moment = require('moment');


// console.log (outCSVFile);

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
        await page.getByRole('button', { name: 'C Login N' }).click();
        await page.getByRole('link', { name: 'C Member login' }).click();
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

    // setup the csv filename
    const dated = moment(new Date()).format('YYYY_MM_DD');
    let fn = `${bank_config['identifier']}_balance_${dated}.csv`
    let outCSVFile = path.join(config['csv_watch'], fn);

    // setup the csv data
    let data = [
        {
            'date': new Date().toISOString(),
            'balance': cleanBalance
        }
    ]

    // console.log(data)
    // console.log(outCSVFile)

    await util.saveDataToCSV(outCSVFile, data);
    // await util.saveCSVFromPromise(bank_config, downloadPromise)
});