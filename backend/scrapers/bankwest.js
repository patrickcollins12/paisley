import { test } from '@playwright/test';
const { DateTime } = require("luxon");
import { tabletojson } from 'tabletojson';

/**
 * This file is a Playwright-based scraper for Bankwest's online banking system.
 * It automates the process of logging into a Bankwest account, extracting account balances,
 * interest rates, and transaction data, and saving the information for further processing.
 * 
 * The script performs the following steps:
 * 
 * 1. **Login**: Automates the login process using credentials from the configuration file.
 * 2. **Extract Account Table**: Navigates to the homepage, locates the accounts table, and extracts its HTML content.
 * 3. **Process Account Data**: Converts the table HTML into JSON, extracts account links, and retrieves interest rates for mortgage accounts.
 * 4. **Save Account Balances and Interest Rates**: Saves the processed account balances and interest rates to a backend API.
 * 5. **Download Transactions CSV**: Automates the process of downloading a CSV file containing recent transactions.
 * 
 * The script uses the following libraries:
 * - `@playwright/test`: For browser automation and testing.
 * - `luxon`: For date and time manipulation.
 * - `tabletojson`: For converting HTML tables into JSON objects.
 * 
 * The script also uses utility modules for logging, configuration, and saving data.
 */

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

  // Step 2 - Get table HTML
  const tableHtml = await getHomePageTable(page);

  // Step 3 - Process table HTML to initial JSON object
  const initialTableObj = await processHomePageTable(page, tableHtml); // Renamed for clarity

  // Step 4 - Transform mortgage accounts within the data, returns new structure
  const processedTableData = await processMortgageAccounts(page, initialTableObj); // Renamed for clarity

  // Step 5 - Save accounts and balances from the processed data
  await saveBalancesAndInterest(processedTableData); // Pass the processed data

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
  await page.getByRole('button', { name: 'Log in' }).click();


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
  // 			<td class="breakable"><span>Complete Variable Home Loan</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="/CMWeb/AccountManage/AccountManage.aspx?q=lhk6admO%2fDKMF3AcaxxH%2fptezwRROL9s5jilNciFNKXYxLwywQ%3d">302-985 13XXXX6</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblCurrentBalance">-$4,540.42</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblCreditLimit">$5,627.89</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl2_Rdelabel1">-$12.53</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>OFFSET TRANSACTION ACCOUNT</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWa2uDbQ1G3zEBQ">302-985 13XXX51</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblCurrentBalance">$3,013.96</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl3_Rdelabel1">$151.62</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>Easy Transaction Account</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOHEjQQ6Gy3">306-821 47XXXX09</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblCurrentBalance">$0.00</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl4_Rdelabel1">$0.00</span>
  // 						</td>
  // 		</tr><tr>
  // 			<td class="breakable"><span>Self Insurance goal</span></td><td class="nowrap" style="font-weight:bold;width:130px;"><a href="TransactionList.aspx?q=ldHIvsOzcYW7P%2f2EsWHjXrFAITUS">306-821 47XXX7</a></td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblCurrentBalance">$262.31</span>
  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblCreditLimit">$0.00</span>
  // 						</td><td class="value">

  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_lblUnclearedFunds">$0.00</span>

  // 						</td><td class="value" nowrap="nowrap">
  // 							<span id="_ctl0_ContentMain_grdBalances__ctl5_Rdelabel1">$262.31</span>
  // 						</td>
  // 		</tr>
  // 	</tbody><tfoot>
  // 		<tr class="total">
  // 			<td colspan="6" class=""><div class="ctrlHolder"><span class="total_label">Total Balance:</span><span class="total_value">-$1,1,264.15</span></div></td>
  // 		</tr><tr class="total">
  // 			<td colspan="6" class=""><div class="ctrlHolder"><span class="total_label">Total Available:</span><span class="total_value">$6,501.40</span></div></td>
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
 * Cleans a number string by removing currency symbols and commas.
 * @param {string} v - The number string to clean.
 * @returns {number} The cleaned number.
 */
const cleanNumber = (v) =>
  typeof v === 'string' ? Number(v.replace(/[$,%]/g, '').replace(/,/g, '')) : v;

const MORTGAGE_ACCOUNT_PATH_PREFIX = "/CMWeb/AccountManage/AccountManage.aspx";
const CREDIT_LIMIT_SUFFIX = "_limit";
const AVAILABLE_FUNDS_SUFFIX = "_avail";

/**
 * Creates the payload for saving an account to the Paisley /api/accounts endpoint.
 * @param {string} accountId - The unique ID for the new account.
 * @param {string} name - The original account name.
 * @param {string} type - The account type (e.g., "Mortgage").
 * @param {object} [extraMetadata={}] - Optional additional metadata to include.
 * @returns {object} The payload object.
 */
function createAccountPayload(accountId, name, type, extraMetadata = {}) {
    return {
        accountid: accountId,
        name: name,
        institution: "Bankwest",
        currency: "AUD",
        type: type,
        status: "active",
        timezone: "Australia/Sydney",
        metadata: JSON.stringify(extraMetadata)
    };
}

/**
 * Creates the payload for saving a balance to the Paisley /api/account_balance endpoint.
 * @param {string} accountId - The account ID to save the balance for.
 * @param {string} isoDatetime - The ISO datetime string for the balance.
 * @param {number} balance - The balance amount.
 * @param {object} [extraData={}] - Optional additional data for the balance entry.
 * @returns {object} The payload object.
 */
function createBalancePayload(accountId, isoDatetime, balance, extraData = {}) {
    return {
        datetime: isoDatetime,
        accountid: accountId,
        balance: balance,
        data: { ...extraData, from: "scraper:bankwest" }
    };
}

/**
 * Navigates to an account page and extracts the interest rate using the iframe method.
 * @param {import("playwright").Page} page - The Playwright page object.
 * @param {string} accountPageLink - The relative URL path to the account page.
 * @returns {Promise<number|null>} The interest rate as a number (decimal), or null if not found/error.
 */
async function scrapeInterestRateForAccount(page, accountPageLink) {
    const fullUrl = baseUrl + accountPageLink;
    try {
        logger.info(`Navigating to account details: ${fullUrl}`);
        await page.goto(fullUrl);
        // Wait for the iframe to be present and potentially loaded
        const iframeLocator = page.locator('iframe[title="AccountManage"]');
        await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });
        const frame = iframeLocator.contentFrame();

        if (!frame) {
             logger.error(`Could not get content frame for iframe[title="AccountManage"] at ${fullUrl}`);
             return null;
        }

        // Now find elements within the frame
        logger.debug(`Locating 'Interest rate' text within the frame...`);
        const interestRateLabel = frame.getByText('Interest rate', { exact: true }).first();
        await interestRateLabel.waitFor({ state: 'visible', timeout: 10000 });
        logger.debug(`Found 'Interest rate' label.`);

        // Find the value in the immediately following sibling div
        const interestRateValueLocator = interestRateLabel.locator('xpath=following-sibling::div[1]');
        await interestRateValueLocator.waitFor({ state: 'visible', timeout: 10000 });

        const interestRateText = await interestRateValueLocator.textContent();
        logger.info(`Found interest rate text: ${interestRateText} for ${accountPageLink}`);

        // Clean and parse the rate
        const rate = parseFloat(interestRateText?.replace(/%$/, '').trim());
        if (!isNaN(rate)) {
            logger.debug(`Parsed interest rate: ${rate}%`);
            return rate / 100; // Convert percentage to decimal
        } else {
            logger.warn(`Could not parse interest rate from text: "${interestRateText}" at ${fullUrl}`);
            return null;
        }

    } catch (error) {
        logger.error(`Error scraping interest rate from ${fullUrl} using iframe method: ${error.message}`, error);
        return null; // Don't block processing for other accounts
    }
}

/**
 * Processes mortgage accounts found in the table data.
 * Scrapes interest rates, creates separate limit/available accounts, and saves balances.
 * @param {import("playwright").Page} page - The Playwright page object.
 * @param {Array<object>} allAccountsData - The array of account data scraped from the main table.
 */
async function processMortgageAccounts(page, allAccountsData) {
    const processedData = []; // Build a new array
    const mortgageLinks = new Set(
        allAccountsData
            .filter(acc => acc.Link?.startsWith(MORTGAGE_ACCOUNT_PATH_PREFIX))
            .map(acc => acc.Link)
    );

    logger.info(`Found ${mortgageLinks.size} potential mortgage accounts to process.`);

    for (const accountData of allAccountsData) {
        const isMortgage = accountData.Link?.startsWith(MORTGAGE_ACCOUNT_PATH_PREFIX);

        if (isMortgage) {
            const originalAccountId = accountData['Account Number']?.replace(/-/g, '');
            const accountName = accountData['Account Name'];

            if (!originalAccountId || !accountName) {
                logger.warn("Skipping mortgage account row due to missing number or name:", accountData);
                continue; // Skip this row entirely
            }

            logger.info(`Processing and transforming mortgage: ${accountName} (${originalAccountId})`);

            try {
                // --- Scrape Interest Rate ---
                const interestRateDecimal = await scrapeInterestRateForAccount(page, accountData.Link);

                // --- Prepare Synthetic Data ---
                const limitAccountId = `${originalAccountId}${CREDIT_LIMIT_SUFFIX}`;
                const availableAccountId = `${originalAccountId}${AVAILABLE_FUNDS_SUFFIX}`;

                const invertedCreditLimit = -cleanNumber(accountData['Credit Limit']);
                const availableBalance = cleanNumber(accountData['Available Balance']);

                // --- Create Synthetic Limit Row ---
                const limitRow = {
                    // Copy relevant base info if needed, or define structure here
                    'Account Name': `${accountName} (Limit)`, // Distinguish name
                    'Account Number': limitAccountId, // Use synthetic ID
                    'Balance': invertedCreditLimit, // Use calculated balance
                    'Type': 'Mortgage', // Keep original type?
                    // Add scraped interest rate as temporary property
                    '_temp_metadata': interestRateDecimal !== null ? { currentInterestRate: interestRateDecimal } : {},
                    // Add other fields needed for createAccountPayload if not generating later
                    'institution': "Bankwest",
                    'currency': "AUD",
                    'status': "active",
                    'timezone': "Australia/Sydney",
                };
                processedData.push(limitRow);
                logger.debug(`Created synthetic limit row for ${limitAccountId}`);

                // --- Create Synthetic Available Row ---
                const availableRow = {
                    'Account Name': `${accountName} (Available)`, // Distinguish name
                    'Account Number': availableAccountId, // Use synthetic ID
                    'Balance': availableBalance, // Use calculated balance
                    'Type': 'Mortgage', // Or 'Offset' / 'Redraw' ?
                     // Add other fields needed for createAccountPayload if not generating later
                     'institution': "Bankwest",
                     'currency': "AUD",
                     'status': "active",
                     'timezone': "Australia/Sydney",
                     '_temp_metadata': {} // Ensure metadata field exists
                };
                processedData.push(availableRow);
                logger.debug(`Created synthetic available row for ${availableAccountId}`);

            } catch (error) {
                logger.error(`Failed to process and transform mortgage account ${accountName} (${originalAccountId}): ${error.message}`, error);
                // Decide if you want to add the original row back or just skip it on error
            }
        } else {
            // --- Keep Non-Mortgage Row ---
            // Add required fields if missing from scraping (assuming defaults)
             accountData['Type'] = accountData['Type'] || 'Transaction'; // Example default
             accountData['institution'] = "Bankwest";
             accountData['currency'] = "AUD";
             accountData['status'] = "active";
             accountData['timezone'] = "Australia/Sydney";
             accountData['_temp_metadata'] = {}; // Ensure metadata field exists
            processedData.push(accountData);
        }
    }

    logger.info(`Finished transforming account data. Original rows: ${allAccountsData.length}, Processed rows: ${processedData.length}`);
    return processedData; // Return the new array with transformed data
}

/** 
 * Saves the balances and attempts to create accounts for the processed data.
 */
async function saveBalancesAndInterest(processedTableData) {
    logger.info(`Saving balances/accounts for ${processedTableData.length} processed rows.`);
    const nowISO = DateTime.now().setZone("Australia/Sydney").toISO();

    for (const accountRow of processedTableData) {
        const accountId = accountRow['Account Number']?.replace(/-/g, '');
        const balance = accountRow['Balance'];
        const accountName = accountRow['Account Name'];
        const accountType = accountRow['Type'] || 'Unknown'; 

        if (!accountId || balance === undefined || balance === null) {
            logger.warn(`Skipping row due to missing Account Number or Balance:`, accountRow);
            continue;
        }

        const cleanBalance = cleanNumber(balance);

        try {
            // 1. Attempt to Create Account
            const accountMetadata = accountRow['_temp_metadata'] || {};
            const accountPayload = createAccountPayload(
                accountId, 
                accountName, 
                accountType, 
                accountMetadata
            );
            
            try {
                await util.createPaisleyResource("/api/accounts", accountPayload);
                logger.debug(`Successfully created account ${accountId}`);
            } catch (createError) {
                // Check if it's the specific "already exists" error from our API
                // Adjust the condition based on the exact error message/structure
                if (createError.responseData?.message === "Account ID already exists." || createError.message?.includes("Account ID already exists")) {
                    logger.debug(`Account ${accountId} already exists. Proceeding to save balance.`);
                    // Optionally, you could call updatePaisleyResource here if needed
                    // await util.updatePaisleyResource("/api/accounts", accountId, accountPayload);
                } else {
                    // For any other creation error, re-throw it to be caught by the outer catch
                    throw createError;
                }
            }

            // 2. Save Balance (only if account creation succeeded or error was ignored)
            const balancePayload = createBalancePayload(accountId, nowISO, cleanBalance, {});
            await util.savePaisleyBalance(balancePayload); // Use the dedicated balance function
            logger.debug(`Saved balance ${cleanBalance} for ${accountId}`);

        } catch (error) {
            // Catch errors from balance saving or non-ignored account creation errors
            logger.error(`Failed processing for account ${accountName} (${accountId}): ${error.message}`, error.responseData || error);
            // Continue to next account
        }
    }
    logger.info(`Finished saving balances.`);
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