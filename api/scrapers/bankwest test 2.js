import { test, expect } from '@playwright/test';
const path = require('path');

const config = require('../ConfigLoader');
const bank_config = config['BankwestScraper'];

test('test', async ({ page }) => {
  await page.goto('http://localhost:8080/Bankwest%20Online%20Banking%202.html');

  // await expect(page.getByText('Transaction Listing')).toBeVisible();
  // const transactions = await page.locator('#_ctl0_ContentMain_grdTransactionList');
  // console.log(await transactions.innerText());

  const urlPattern = /aspx/;
  const matchingHrefs = await page.$$eval('#_ctl0_ContentMain_grdTransactionList a', (anchors, urlPattern) => {
    // Filter anchors that match the regex pattern
    return anchors
        .map(anchor => anchor.href)
        .filter(href => urlPattern.test(href));
  }, urlPattern);

  console.log(matchingHrefs);


});
