import { test, expect } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../ConfigLoader');
const bank_config = config['RestSuperScraper'];

test('test', async ({ page }) => {
    test.slow();

    // DEBUG=true npx test
    let debug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

    let userName = bank_config['Username']
    let password = bank_config['Password']
    
    let url = (debug)?
        'http://localhost:8080/rest_super.html' :
        'https://rest.com.au/';

    await page.goto(url);

    if (!debug) {
        await page.getByRole('button', { name: 'C Login N' }).click();
        await page.getByRole('link', { name: 'C Member login' }).click();
        await page.getByRole('textbox').fill(userName);
        await page.getByRole('textbox').press('Enter');
        await page.locator('input[type="password"]').fill(password);
        await page.getByRole('button', { name: 'Log in', exact: true }).click();
        await page.getByRole('button', { name: 'Go to Member Access' }).click();
    }

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
    console.log(util.cleanPrice(rawBalance));

    // await util.saveCSVFromPromise(bank_config, downloadPromise)
});

