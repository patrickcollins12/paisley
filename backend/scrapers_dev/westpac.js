const playwright = require("playwright"); // ^1.42.1
// import { test } from '@playwright/test';
// const { test } = require('@playwright/test');
const util = require('../src/ScraperUtil');
const config = require('../src/Config');
config.load()
const bank_config = config['WestpacScraper'];
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)" +
  " Chrome/69.0.3497.100 Safari/537.36";

// test('test', async ({ page }) => {
(async () => {
  // test.slow();
  const url = 'https://www.westpac.com.au/'

  // making playwright work in headless mode
  // https://stackoverflow.com/questions/75488727/playwright-works-in-headful-mode-but-fails-in-headless
  const browser = await playwright.firefox.launch();
  const context = await browser.newContext({ userAgent, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "commit" });
  
  // Let's go
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Customer ID', { exact: true }).click();
  await page.getByLabel('Customer ID', { exact: true }).fill(bank_config['Customer ID']);
  await page.getByLabel('Customer ID', { exact: true }).press('Tab');

  // debug
  // console.log(await page.content());
  // await page.screenshot({ path: "test.png", fullPage: true });
  // console.log("here")

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
  await browser.close(); // Close the browser

})();
