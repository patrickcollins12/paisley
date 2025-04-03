import { test, expect } from '@playwright/test';
const { DateTime } = require("luxon");

const config = require('../src/Config');
config.load()

const util = require('../src/ScraperUtil');

const logger = require('../src/Logger');

const bank_config = config['RestSuperScraper'];

test('test', async ({ page }) => {
    test.slow();

    let DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

    let userName = bank_config['Username']
    let password = bank_config['Password']

    let url = (DEBUG) ?
        'http://localhost:8080/rest_super.html' :
        'https://rest.com.au/';

    await page.goto(url);

    if (!DEBUG) {
        await page.getByRole('button', { name: 'Login' }).click();
        await page.getByRole('link', { name: 'Member login' }).click();
        await page.getByRole('textbox').fill(userName);
        await page.getByRole('textbox').press('Enter');
        await page.locator('input[type="password"]').fill(password);
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.getByRole('button', { name: 'Go to Member Access' }).click();
    }

    // download the transaction history
    // await page.getByRole('link', { name: 'Your account' }).click();
    // await page.getByRole('link', { name: 'Transaction history' }).click();
    // await page.getByLabel('Custom period').check();
    // const downloadPromise = page.waitForEvent('download');
    // await page.getByRole('link', { name: 'CSV' }).click();
    // const download = await downloadPromise;


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
    util.saveToPaisley("/api/account_balance", data)


    // download the transaction history
    await page.getByRole('link', { name: 'Your account' }).click();
    await page.getByRole('heading', { name: 'Balance enquiry' }).click();
    await page.getByRole('link', { name: 'Transaction history' }).click();
    await page.getByRole('heading', { name: 'Transaction history' }).click();
    await page.getByLabel('Custom period').check();
    await page.getByRole('link', { name: 'Export' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'CSV' }).click();
    const download = await downloadPromise;
    await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)

    
});
