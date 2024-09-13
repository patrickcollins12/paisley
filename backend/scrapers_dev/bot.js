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
  const url = 'https://bot.sannysoft.com/'

  // making playwright work in headless mode
  // https://stackoverflow.com/questions/75488727/playwright-works-in-headful-mode-but-fails-in-headless
  const browser = await playwright.firefox.launch({headless:false});
  const context = await browser.newContext({ userAgent, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "commit" });
  
  // debug
  console.log(await page.content());
  await page.screenshot({ path: "test.png", fullPage: true });

  await browser.close(); // Close the browser

})();
