const playwright = require("playwright"); // ^1.42.1
import { test } from '@playwright/test';
// const { test } = require('@playwright/test');
const { DateTime } = require("luxon");

const config = require('../src/Config');
config.load()
const bank_config = config['WestpacScraper'];

const util = require('../src/ScraperUtil');
const logger = require('../src/Logger');
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)" +
  " Chrome/69.0.3497.100 Safari/537.36";

test('test', async ({ page }) => {
  // (async () => {
  // test.slow();
  const url = 'https://www.westpac.com.au/'

  // making playwright work in headless mode
  // https://stackoverflow.com/questions/75488727/playwright-works-in-headful-mode-but-fails-in-headless
  const browser = await playwright.firefox.launch();
  const context = await browser.newContext({ userAgent, bypassCSP: true });
  const page2 = await context.newPage();
  await page2.goto(url, { waitUntil: "commit" });

  // Let's go
  await page2.getByRole('link', { name: 'Sign in' }).click();
  await page2.getByLabel('Customer ID', { exact: true }).click();
  await page2.getByLabel('Customer ID', { exact: true }).fill(bank_config['Customer ID']);
  await page2.getByLabel('Customer ID', { exact: true }).press('Tab');

  // debug
  // logger.info(`${await page.content()}`);
  // await page.screenshot({ path: "test.png", fullPage: true });
  // logger.info("here")

  await page2.getByLabel('Password').fill(bank_config['Password']);
  await page2.locator('label').filter({ hasText: 'Remember customer ID Not recommended on public or shared devices' }).locator('span').nth(1).click();
  await page2.getByRole('button', { name: 'Sign in' }).click();

  await page2.goto('https://banking.westpac.com.au/secure/banking/reportsandexports/exportparameters/2/');
  // await page.getByRole('link', { name: 'Export Transactions' }).click();
  await page2.getByRole('link', { name: 'a preset range' }).click();
  await page2.getByRole('link', { name: 'Last 60 days' }).click();

  // when i was travelling to the US I noticed that the 60 day selector used my 
  // browser's timezone which was wrong... so I'm going to try to set the timezone to Sydney
  const timezone = 'Australia/Sydney' // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  const dateFormat = 'dd/MM/yyyy'     // '20/08/2024'  https://github.com/moment/luxon/blob/master/docs/formatting.md
  const date24HoursAgo = DateTime.now().setZone(timezone).minus({ hours: 24 }).toFormat(dateFormat);

  await page2.getByLabel('to date requiredPlease enter').fill(date24HoursAgo);

  //   await page.getByPlaceholder(' Select accounts').click();
  //   await page.getByRole('link', { name: 'Select dropdown' }).click();
  //   await page.getByRole('link', { name: 'All', exact: true }).click();
  const downloadPromise = page2.waitForEvent('download');
  await page2.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;

  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)
  await browser.close(); // Close the browser


});