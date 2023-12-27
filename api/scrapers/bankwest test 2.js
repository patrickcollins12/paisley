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
  return;

  
  await page.goto('http://localhost:8080/Bankwest%20Online%20Banking.html');

  await expect(page.getByText('Accounts as at')).toBeVisible();

  // let data = await extractTable(page,'#_ctl0_ContentMain_grdTransactionList')
  // let data = await extractTable(page,'#_ctl0_ContentMain_grdBalances')
  // console.log(data);

  function createFullURLfromPath(pageUrl,url){

    if (!url.startsWith('http')) {
      const u = new URL(pageUrl);
      // console.log(u)
  
      u.pathname = origUrl;
      url = u.toString();
    }

    return url;
  }

  let origUrl = "/CMWeb/AccountManage/AccountManage.aspx?q=lhk6admO%2fDKMp%2femSB%2b8s0ElAVCAIblL9oR753VECqRQwnbaawFipUDaMR5%2b8B%2bncChP1773slj1Ou%2bgpftJGgoWF3sw7Y0O0l1OZbaJPVY%3d";
  console.log(createFullURLfromPath(page.url(), origUrl));

  
});
