import { test } from '@playwright/test';
const { DateTime } = require("luxon");
import { tabletojson } from 'tabletojson';

const config = require('../src/Config');
config.load();

const util = require('../src/ScraperUtil');
const logger = require('../src/Logger');

const bank_config = config['BankwestScraper'];

const baseUrl = `https://ibs.bankwest.com.au`

test('Bankwest Scraper Test', async ({ page }) => {
  test.slow();

  // Step 1 - Login
  await login(page);

  // Step 2 - Navigate to main page and process get the table on the homepage
  const tableHtml = await getHomePageTable(page)

  // Step 3 - process the table
  const tableObj = await processHomePageTable(page, tableHtml);

  // Step 4 - process mortgage accounts and get interest rates
  await processMortgageAccounts(page, tableObj);

  // Step 5 - save the balances and interest
  await saveBalancesAndInterest(tableObj)

  // Step 6 - Download transactions CSV
  await downloadTransactionsCSV(page);
});

/**
 * Logs into the Bankwest account.
 */
async function login(page) {
  logger.info("Logging in...");
  await page.goto(`${baseUrl}/Session/PersonalLogin`);
  await page.getByRole('textbox', { name: 'Personal Access Number (PAN)' }).fill(bank_config['pan']);
  await page.getByRole('textbox', { name: 'Password' }).fill(bank_config['password']);
  await page.getByRole('button', { name: 'Login' }).click();


  const table = page.locator('#_ctl0_ContentMain_grdBalances');
  await table.waitFor({ state: 'visible', timeout: 10000 });
  await page.goto(`${baseUrl}/CMWeb/AccountInformation/AI/Balances.aspx`);

  logger.info("Login successful.");

}

async function getHomePageTable(page) {
  logger.info("Waiting for the accounts table...");
  //   const html = `
  //   <table cellspacing="0" border="0" id="_ctl0_ContentMain_grdBalances" style="border-collapse:collapse;">
  // 	<caption>
  // 		Accounts
  // 	</caption><thead>
  // 		<tr>
  // 			<th scope="col">Account Name</th><th scope="col">Account Number</th><th class="value" scope="col">Balance</th><th class="value" scope="col">Credit Limit</th><th class="value" scope="col">Uncleared Funds</th><th class="value" scope="col">Available Balance</th>
  // 		</tr>
  // 	</thead><tbody>
  // 		<tr>
  // 			<td class="breakable"><span>Complete Variable Home Loan</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="/CMWeb/AccountManage/AccountManage.aspx?q=lhk6admO%2fDKMp%2femSB%2b8s0ElAVCAIblL9oR753VECqRQwnbaawFipcin7HCrYaREFVdpeF3AcaxxH%2fptezwRROL9s5jilNciFNKXYxLwywQ%3d">302-985 1358636</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblCurrentBalance">-$1,554,540.42</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblCreditLimit">$1,550,627.89</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_Rdelabel1">-$3,912.53</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>OFFSET TRANSACTION ACCOUNT</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ9w1i2vD9MiiGJa7JcAq%2bahYZPpCuaEHjzxYJPIvpXBiKxymAKzDXuG0BdtmyvXa2uDbQ1G3zEBQ">302-985 1360851</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblCurrentBalance">$430,013.96</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_Rdelabel1">$427,151.62</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>Easy Transaction Account</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ%2bkAfZrHbFX3FoIe3KPs1tFGXBm%2bPm3WfR5QffrUMchWxonYixtYjzJ1mMJXB1NIEueHEjQQ6Gy3">306-821 4715409</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblCurrentBalance">$0.00</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_Rdelabel1">$0.00</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>Self Insurance goal</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ%2bkAfZrHbFX3XhMexw6PfkfztgHS1%2fmuhmo%2bVgjXIot%2bEO8F4kN7JGwRqexG8ESPbI3iXrFAITUS">306-821 4715417</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblCurrentBalance">$3,262.31</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_Rdelabel1">$3,262.31</span>
  // 						</td>
  // 		</tr>
  // 	</tbody><tfoot>
  // 		<tr class="total">
  // 			<td colspan="6" class=""><div class="ctrlHolder"><span class="total_label">Total Balance:</span><span class="total_value">-$1,121,264.15</span></div></td>
  // 		</tr><tr class="total">
  // 			<td colspan="6" class=""><div class="ctrlHolder"><span class="total_label">Total Available:</span><span class="total_value">$426,501.40</span></div></td>
  // 		</tr>
  // 	</tfoot>
  // </table>
  // `

  // Locate and wait for the table
  const table = page.locator('#_ctl0_ContentMain_grdBalances');
  await table.waitFor({ state: 'visible', timeout: 10000 });
  logger.info("Table found!");

  const html = await table.evaluate(el => el.outerHTML);

  return html
}

/**
 * Finds the home page accounts table, extracts links, and retrieves interest rates.
 */
async function processHomePageTable(page, html) {

  const tableObj = tabletojson.convert(html, { stripHtmlFromCells: true })[0];
  const tableObjWithHTML = tabletojson.convert(html, { stripHtmlFromCells: false })[0];

  // Regex to match href values inside <a> tags
  // Use map to extract URLs
  const hrefRegex = /href="([^"]+)"/;
  const extractedUrls = tableObjWithHTML
    .map(row => row['Account Number']?.match(hrefRegex)?.[1] || null) // Extracts href safely
    .filter(url => url !== null); // Removes null values

  // put the extracted URLs back into the converted object
  for (let i = 0; i < tableObj.length; i++) {
    tableObj[i]['Link'] = extractedUrls[i];
  }

  return tableObj

}

/**
 * Finds the home page accounts table, extracts links, and retrieves interest rates.
 */
async function processMortgageAccounts(page, tableObj) {

  const filteredAccounts = tableObj
    .filter(row =>
      row.Link?.startsWith('/CMWeb/AccountManage/AccountManage.aspx'));

  // logger.info(`Filtered Accounts: ${filteredAccounts}`);

  for (const obj of filteredAccounts) {
    const link = baseUrl + obj['Link']
    logger.info(`Navigating to: ${link}`);
    await page.goto(link);
    logger.info("Clicked on mortgage-type account");

    // Extract interest rate
    const interestRate = await getInterestRate(page);
    obj['Interest Rate'] = interestRate;
    logger.info(`Found interest rate: ${interestRate}, for ${obj['Account Name']}`);
  }

  logger.info("Finished processing mortgage accounts.");
}

/** 
 * Saves the balances and interest rates to a CSV file.
 */
async function saveBalancesAndInterest(tableObj) {
  // const tableObj =
  //   [
  //     {
  //       'Account Name': 'Complete Variable Home Loan',
  //       'Account Number': '302-985 1358636',
  //       Balance: '-$1,545,113.03',
  //       'Credit Limit': '$1,549,447.71',
  //       'Uncleared Funds': '$0.00',
  //       'Available Balance': '$4,334.68',
  //       Link: '/CMWeb/AccountManage/AccountManage.aspx?q=lhk6admO%2fDKMp%2femSB%2b8s0ElAVCAIblL9oR753VECqRQwnbaawFipYPs90NMWg8xUm%2fHGyEJhKrEhbcvSet9JIfOZDpI7lDSuBU2YBqLcxc%3d',
  //       'Interest Rate': '5.84%'
  //     },
  //     {
  //       'Account Name': 'OFFSET TRANSACTION ACCOUNT',
  //       'Account Number': '302-985 1360851',
  //       Balance: '$418,984.03',
  //       'Credit Limit': '$0.00',
  //       'Uncleared Funds': '$0.00',
  //       'Available Balance': '$418,725.00',
  //       Link: 'TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ9w1i2vD9MiiGJa7JcAq%2bajE8S7s9LOp%2f1SYOdA3g1TrVNDYYGtc3yZr3gh34A%2fH9RNHOpw%2bj6sE'
  //     },
  //     {
  //       'Account Name': 'Easy Transaction Account',
  //       'Account Number': '306-821 4715409',
  //       Balance: '$0.00',
  //       'Credit Limit': '$0.00',
  //       'Uncleared Funds': '$0.00',
  //       'Available Balance': '$0.00',
  //       Link: 'TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ%2bkAfZrHbFX3FoIe3KPs1tE3%2bEUeekMvDlrhcjsp3KudJGs8Q2FvId1sWecmpyuCuwXcKP5rlVld'
  //     },
  //     {
  //       'Account Name': 'Self Insurance goal',
  //       'Account Number': '306-821 4715417',
  //       Balance: '$3,262.31',
  //       'Credit Limit': '$0.00',
  //       'Uncleared Funds': '$0.00',
  //       'Available Balance': '$3,262.31',
  //       Link: 'TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjJ%2bkAfZrHbFX3XhMexw6PfkekGeJADDokLamTVbby7SQca0yTbtKaT%2bEmk5hr8fiYpfnTRABskUAI'
  //     },
  //     { 'Account Name': 'Total Balance:-$1,122,866.69', Link: undefined },
  //     { 'Account Name': 'Total Available:$426,321.99', Link: undefined }
  //   ]


  // only where the object contains an account number
  const filteredAccounts = tableObj
    .filter(row =>
      row['Account Number'] !== undefined);

  for (const acc of filteredAccounts) {
    const account_number = acc['Account Number'];

    // clean up the account number to remove "-"'s
    const accountid = account_number.replace(/-/g, '');
    const balance = acc['Balance'];

    const cleanNumber = (v) => 
      typeof v === 'string' ? Number(v.replace(/[$,%]/g, '').replace(/,/g, '')) : v;

    let data = {
      'datetime': DateTime.now().setZone("Australia/Sydney").toISO(),
      "accountid": accountid,
      "balance": cleanNumber(balance),
      "data": {}
    }

    data.data = Object.fromEntries(
      [
        ['credit_limit', acc['Credit Limit']], 
        ['uncleared_funds', acc['Uncleared Funds']], 
        ['available_balance', acc['Available Balance']], 
        ['interest', acc['Interest Rate'] ? cleanNumber(acc['Interest Rate']) / 100 : undefined] // Convert percentage to decimal
      ]
      .map(([k, v]) => [k, cleanNumber(v)]) // Convert values to numbers
      .filter(([_, v]) => v !== undefined && v !== 0 && v !== '') // Remove undefined, 0, and empty values
    );

    // logger.info(JSON.stringify(data, null, 2));
    await util.saveToPaisley("/api/account_balance", data);
  }


}

/**
 * Extracts the interest rate from an iframe in the mortgage account page.
 */
async function getInterestRate(page) {

  const interestRateLabel = page
    .locator('iframe[title="AccountManage"]')
    .contentFrame()
    .getByText('Interest rate')
    .first();
  await interestRateLabel.waitFor({ state: 'visible', timeout: 10000 });

  const html = await interestRateLabel.evaluate(el => el.outerHTML);

  const interestRateValue = await interestRateLabel
    .locator('xpath=following-sibling::div[1]');
  await interestRateValue.waitFor({ state: 'visible', timeout: 10000 });

  const interest = await interestRateValue.textContent()
  logger.info(`Found the interest rate: ${interest}`);
  return interest

}

/**
 * Navigates to the transaction search and downloads the transactions CSV.
 */
async function downloadTransactionsCSV(page) {
  logger.info("Navigating to accounts section...");
  await page.getByRole('button', { name: 'Accounts' }).click();
  logger.info("Navigating to transaction search...");
  await page.getByRole('link', { name: 'Transaction search' }).click();

  // Fill the form and trigger CSV download
  logger.info("Filling and exporting CSV form...");
  await page.locator('[id="_ctl0_ContentMain_ddlAccount"]').selectOption('[All]');
  await page.locator('[id="_ctl0_ContentMain_ddlRangeOptions"]').selectOption('L30Days');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export' }).click();
  logger.info("Download triggered...");

  const download = await downloadPromise;
  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download);

  logger.info("CSV download completed.");
}