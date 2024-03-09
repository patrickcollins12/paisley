import { test, expect } from '@playwright/test';
const util = require('../src/ScraperUtil');
const config = require('../src/Config');
config.load()
const bank_config = config['CBAScraper'];


test('test', async ({ page }) => {
    test.slow();

    await page.goto('https://www2.commsec.com.au/secure/login?LoginResult=LoginRequired&r=https%3a%2f%2fwww2.commsec.com.au%2f');
    await page.getByPlaceholder('Client ID').click();
    await page.getByPlaceholder('Client ID').fill(bank_config['Client ID']);
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill(bank_config['Password']);
    await page.getByRole('button', { name: 'Login' }).first().click();

    await page.waitForSelector('text=Commonwealth Securities Limited ABN 60 067 254 399')
    await page.getByRole('link', { name: 'NetBank', exact: true }).click();

    // await page.goto('https://www2.commsec.com.au/private/singlesignon/jump.aspx');
    // await page.goto('https://www.commbank.com.au/retail/netbank/home/');
    

    await page.waitForSelector('text=Apply for a new product')

    await page.getByRole('link', { name: 'CDIA' }).click();
    await page.getByRole('button', { name: 'Export' }).click();
    await page.locator('label').filter({ hasText: 'CSV (e.g. MS Excel)' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();

    const download = await downloadPromise;

    // Wait for the download process to complete and save the downloaded file somewhere.
    await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)

});