import { test, expect } from '@playwright/test';
const path = require('path');

const config = require('../ConfigLoader');
const bank_config = config['BankwestScraper'];

//////////////
// transactionDetails[heading] = content;
// modifyRowContent(transactionDetails,heading);
function modifyRowContent(obj, heading) {
  let content = obj[heading];

  // Payment date: 23/04/2023 (AWST)
  //   to
  // Date: 23/04/2023 
  if (heading === "Payment date") {
    let dateRe = /\d{1,2}\/\d{1,2}\/\d{4}/;
    let match = content.match(dateRe);
    if (match) {
        obj['Date'] = match[0];
    }
  }

  // Debit amount or Credit amount
  // $30,450.00 --> 30450.00
  else if (heading && /amount/i.test(heading)) {
      obj[heading] = content.replace(/[^0-9.]/g, "");
  }

  /*
  'Business name': 'Priceline Pharmacy (Westfield Chatswood)\n' +
                      'PLINE PH CHATSWOOD CHATSWOOD AUS\n' +
                      'PURCHASE AT 2:21PM 20DEC',

  OR
  'Business name': 'PLINE PH CHATSWOOD CHATSWOOD AUS\n' +
          'PURCHASE AT 2:21PM 20DEC',

  OR
  'Business name': 'PLINE PH CHATSWOOD CHATSWOOD AUS\n'
  */

  else if (heading == "Business name") {
      let arr = content.split('\n');
      // results['original'] = content;


      // Find and remove "PURCHASE AT **8:21AM** 20DEC"
      let fullDateRE = / AT (\d{1,2}\:\d{1,2}[AP]M) (\d{1,2}\w{1,3})/;

      // Match 8:08PM
      let shortTimeRE = /\b\d{1,2}\:\d{1,2}[AP]M\b/;

      let lastRow = arr[arr.length - 1];
      if (fullDateRE.test(lastRow)) {
          let matches = lastRow.match(fullDateRE);
          obj['time'] = matches[1];
          // console.log(`${lastRow} --> ${time}`)
          arr.pop();
      } else if (shortTimeRE.test(lastRow)) {
          obj['time'] = lastRow.match(shortTimeRE)[0];
      }

      obj['description'] = arr.pop() || "";
      obj['business'] = arr.pop() || "";
  }
  // console.log(results);
  // return results;
}


test('test', async ({ page }) => {
  
  test.setTimeout(300000);

  await page.goto('https://ibs.bankwest.com.au/Session/PersonalLogin');
  await page.getByRole('textbox', { name: 'Personal Access Number (PAN)' }).fill(bank_config['pan']);
  await page.getByRole('textbox', { name: 'Password' }).fill(bank_config['password']);
  await page.getByRole('button', { name: 'Login' }).click();

  // await page.getByRole('link', { name: '302-985 1358636' }).click();

  // const frame = page.frameLocator('#appObject'); // Locate the iframe
  // const textHtml = await frame.locator('.account-info-details').innerText(); // Get the innerText of the element within the iframe
  // console.log(textHtml);

  await expect(page.getByText('Accounts as at')).toBeVisible();

  // find TransactionList items
  const urlPattern = /TransactionList\.aspx/;
  const matchingHrefs = await page.$$eval('a', (anchors, urlPattern) => {
    // Filter anchors that match the regex pattern
    return anchors
      .map(anchor => anchor.href)
      .filter(href => urlPattern.test(href));
  }, urlPattern);


  console.log(matchingHrefs);

  /////
  // foreach account
  for (const url of matchingHrefs) {
    await page.goto(url);
    await expect(page.getByText('Transaction Listing')).toBeVisible();

    const urlPattern = /aspx/;
    const matchingHrefs2 = await page.$$eval('#_ctl0_ContentMain_grdTransactionList a', (anchors, urlPattern) => {
      // Filter anchors that match the regex pattern
      return anchors
        .map(anchor => anchor.href)
        .filter(href => urlPattern.test(href));
    }, urlPattern);

    //////
    // foreach transaction
    console.log(matchingHrefs2);
    for (const url of matchingHrefs2) {
      await page.goto(url);
      // const frame = page.frameLocator('#appObject'); // Locate the iframe
      // Get frame using the frame's name attribute
      const frame = await page.frameLocator('#appObject');
      // const textHtml = await frame.locator('.account-info-details').innerText(); // Get the innerText of the element within the iframe

      //////
      // get the Details or Transaction Details header from the transaction page
      await expect(frame.locator('h1').getByText('Details')).toBeVisible();

      /*
        transaction-details
          transaction-details-row
            transaction-details-heading Key
            transaction-details-content Val
      */
      const rowsLocator = frame.locator('.transaction-details .transaction-details-row');
      const rowCount = await rowsLocator.count();
      

      let transactionDetails = {};
      for (let i = 0; i < rowCount; i++) {
          const headingLocator = rowsLocator.nth(i).locator('.transaction-details-heading');
          const contentLocator = rowsLocator.nth(i).locator('.transaction-details-content');
      
          let heading = await headingLocator.textContent();
          // const content = await contentLocator.textContent();
      
          let content = await contentLocator.evaluate(node => {
              return Array.from(node.querySelectorAll('b')).map(b => b.textContent.trim()).join('\n');
          });
      
          heading = heading.trim();
          
          transactionDetails[heading] = content;
          modifyRowContent(transactionDetails,heading);


      }

      console.log(transactionDetails);


    }

  }

});

