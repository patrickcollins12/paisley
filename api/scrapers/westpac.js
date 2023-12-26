import { test, expect } from '@playwright/test';
const path = require('path');

const ConfigManager = require('../ConfigManager.js');
const configManager = new ConfigManager('pfm');
const config = configManager.readConfig();
const bank_config = config['WestpacScraper'];

test('test', async ({ page }) => {
  await page.goto('https://www.westpac.com.au/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Customer ID', { exact: true }).click();
  await page.getByLabel('Customer ID', { exact: true }).fill(bank_config['Customer ID']);
  await page.getByLabel('Customer ID', { exact: true }).press('Tab');
  await page.getByLabel('Password').fill(bank_config['Password']);
  await page.locator('label').filter({ hasText: 'Remember customer ID Not recommended on public or shared devices' }).locator('span').nth(1).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('https://banking.westpac.com.au/secure/banking/reportsandexports/home');
  await page.getByRole('link', { name: 'Export Transactions' }).click();
  await page.getByRole('link', { name: 'a preset range' }).click();
  await page.getByRole('link', { name: 'Last 60 days' }).click();
//   await page.getByPlaceholder(' Select accounts').click();
//   await page.getByRole('link', { name: 'Select dropdown' }).click();
//   await page.getByRole('link', { name: 'All', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;

  const fileName = [bank_config['identifier'], process.pid, download.suggestedFilename()].join('_')
  let csv_location = path.join( config['csv_watch'], fileName );
  await download.saveAs(csv_location);
  console.log(`Saved to ${csv_location}`)

//   await download.saveAs('/tmp/westpac' + download.suggestedFilename());

});

