import { test, expect } from '@playwright/test';
const path = require('path');

const config = require('../ConfigLoader');
const bank_config = config['BankwestScraper'];

async function extractTable(page,id) {
  /////////
  // Extract the table:
  //    <table id=#_ctl0_ContentMain_grdTransactionList
  //      thead > th > td td td
  //              th > td td td
  //      tbody > tr > td td td
  //              tr > td td td
  let headers = [];
  let data = []
  let table = page.locator(id);

  // get the headers
  for (const th of await (table.locator('thead th').all())) {
    const td = (await th.innerText()).trim();
    headers.push(td);
  }

  // foreach tr row
  for (const row of await table.locator('tbody tr').all()) {

    // foreach td column
    let resultRow = {}
    let j = 0
    for (const col of await row.locator('td').all()) {

      // extract the url and store it
      const link = col.locator('a');
      if (await link.count() > 0) {
        const url = await link.getAttribute('href');
        if (url) resultRow['url'] = url
      }

      // store the val
      const colText = (await col.innerText()).trim();
      if (colText) {
        resultRow[headers[j++]] = colText;
      }
    }
    data.push(resultRow);
  }

  return data;
}

test('test', async ({ page }) => {
  await page.goto('http://localhost:8080/Bankwest%20Online%20Banking%202.html');

  await expect(page.getByText('Transaction listing')).toBeVisible();

  let data = await extractTable(page,'#_ctl0_ContentMain_grdTransactionList')
  console.log(data);



});
