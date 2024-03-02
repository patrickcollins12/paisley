import { test, expect } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../Config');
config.load()
const bank_config = config['CommsecScraper'];

test('test', async ({ page }) => {
  await page.goto('https://www2.commsec.com.au/secure/login?LoginResult=LoginRequired&r=https%3a%2f%2fwww2.commsec.com.au%2f');
  await page.getByPlaceholder('Client ID').click();
  await page.getByPlaceholder('Client ID').fill(bank_config['Client ID']);
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(bank_config['Password']);
  await page.getByRole('button', { name: 'Login' }).first().click();
  await page.getByTitle('Portfolio').click();
  await page.getByRole('link', { name: 'View Holdings' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('button', { name: 'Download' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV CSV' }).click();
  const download = await downloadPromise;

  // Wait for the download process to complete and save the downloaded file somewhere.
  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)


});