import { test, expect } from '@playwright/test';
const os = require('os');
const path = require('path');

const config = require(os.homedir() + '/pfm/config.js');
const bank_config = config['CommsecScraper'];

test('test', async ({ page }) => {
  await page.goto('https://www2.commsec.com.au/secure/login?LoginResult=LoginRequired&r=https%3a%2f%2fwww2.commsec.com.au%2f');
  await page.getByPlaceholder('Client ID').click();
  await page.getByPlaceholder('Client ID').fill(bank_config['Client ID']);
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(bank_config['Password']);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByTitle('Portfolio').click();
  await page.getByRole('link', { name: 'View Holdings' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('button', { name: 'Download' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV CSV' }).click();
  const download = await downloadPromise;

  const fileName = [bank_config['identifier'], process.pid, download.suggestedFilename()].join('_')
  let csv_location = path.join( config['csv_watch'], fileName );
  await download.saveAs(csv_location);
  console.log(`Saved to ${csv_location}`)

});