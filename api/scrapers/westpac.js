import { test, expect } from '@playwright/test';
const util = require('../src/ScraperUtil');
const config = require('../src/Config');
config.load()
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
  await page.goto('https://banking.westpac.com.au/secure/banking/reportsandexports/exportparameters/2/');
  // await page.getByRole('link', { name: 'Export Transactions' }).click();
  await page.getByRole('link', { name: 'a preset range' }).click();
  await page.getByRole('link', { name: 'Last 60 days' }).click();
//   await page.getByPlaceholder(' Select accounts').click();
//   await page.getByRole('link', { name: 'Select dropdown' }).click();
//   await page.getByRole('link', { name: 'All', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;

  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)

});

