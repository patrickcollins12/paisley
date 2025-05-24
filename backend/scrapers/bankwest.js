import { test, expect } from '@playwright/test';
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
    const accountTableObject = await getHomePageTable(page);

    // Step 3 - Process table Object to initial JSON object
    const accountData = await processHomePageTable(accountTableObject); // Renamed for clarity

    await processEachAccount(page, accountTableObject, accountData);


    // Step 5 - Save accounts and balances from the processed data
    await saveBalancesAndInterest(accountData); // Pass the processed data

    // Step 6 - Download transactions CSV
    await downloadTransactionsCSV(page);
});

// Logs into the Bankwest account.
async function login(page) {
    logger.info("Logging in...");
    await page.goto(`${baseUrl}/Session/PersonalLogin`);
    await page.getByRole('textbox', { name: 'Personal Access Number (PAN)' }).fill(bank_config['pan']);
    await page.getByRole('textbox', { name: 'Password' }).fill(bank_config['password']);
    await page.getByRole('button', { name: 'Log in' }).click();

    const table = page.locator('html > body > div.full-width-container > div.all-columns');
    await table.waitFor({ state: 'visible', timeout: 10000 });
    await page.goto(`${baseUrl}/CMWeb/AccountInformation/AI/Balances.aspx`);

    logger.info("Login successful.");

}

async function getHomePageTable(page) {

    // Wait for the new iframe to be present and visible
    const iframeLocator = page.locator('iframe#appObject[title="Homescreen"]');
    await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });

    const frame = await iframeLocator.contentFrame();

    if (!frame) {
        logger.error(`Could not get content frame for iframe#appObject[title="Homescreen"] at ${fullUrl}`);
        return null;
    }

    // Locate and wait for the table
    // Step 1: Locate the "Accounts" tile
    const accountsTile = frame.locator('.campfire-tile:has(div.heading:has-text("Accounts"))');
    await expect(accountsTile).toBeVisible();

    // Step 2: Locate the grid container and get full HTML including its tag
    const accountTable = accountsTile.locator('> div.ng-star-inserted');
    await expect(accountTable).toBeVisible();

    return accountTable
}


// From the accounts table, basic info.
async function processHomePageTable(accountTableObject) {
    const tileSelector = 'campfire-tile-row.account-tile-row';
    const tiles = accountTableObject.locator(tileSelector);
    const count = await tiles.count();

    let account_data = []

    for (let i = 0; i < count; i++) {
        const tile = tiles.nth(i);

        const account_name = await tile.locator('.card-heading').textContent();

        const numberParts = await tile
            .locator('.card-number p:not(.dot-grey)')
            .allTextContents();
        const account_number = numberParts.map(part => part.trim()).join(' ');

        const account_balance = await tile.locator('.balance .money-amount').textContent();
        const account_available = await tile.locator('.available .money-amount').textContent();

        const d = { account_name, account_number, account_balance, account_available }
        // trim the values
        Object.keys(d).forEach(key => { d[key] = d[key]?.trim(); });

        account_data.push(d);
    }

    return account_data
}

async function processEachAccount(page, accountTableObject, accountData) {
    const tileSelector = 'campfire-tile-row.account-tile-row';

    let tiles = await accountTableObject.locator(tileSelector).all();

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const account_name = (await tile.locator('.card-heading').textContent())?.trim();
        console.log(`Processing tile ${i + 1}/${tiles.length}: ${account_name}`);

        const clickable = tile.locator('.tile-row-layout');
        const prevUrl = page.url();

        await clickable.click({ force: true });
        await page.waitForFunction(url => location.href !== url, prevUrl, { timeout: 10000 });

        // wait for the page to be loaded
        await page.waitForLoadState('load'); // or 'domcontentloaded'

        if (page.url().includes(MORTGAGE_ACCOUNT_PATH_PREFIX)) {
            console.log(`🏠 Identified as a mortgage account.`);
            await processMortgageAccount(page, accountData, i);
        }
        // await processAccountDetailPage(page, account_name);

        // Re-navigate and re-select everything
        await page.goto('https://ibs.bankwest.com.au/CMWeb/AccountInformation/AI/Balances.aspx');
        accountTableObject = await getHomePageTable(page);
        tiles = await accountTableObject.locator(tileSelector).all();
    }
}

async function processMortgageAccount(page, accountData, accountIndex) {
    console.log(`accountIndex: ${accountIndex}`);
    // Wait for the iframe to be present and potentially loaded
    const iframeLocator = page.locator('iframe[title="AccountManage"]');
    await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });
    const frame = iframeLocator.contentFrame();

    if (!frame) {
        logger.error(`Could not get content frame for iframe[title="AccountManage"] at ${fullUrl}`);
        return null;
    }

    const interestRateDecimal = await scrapeInterestRateForAccount(frame);
    const originalAccount = accountData[accountIndex];
    
    // Create synthetic accounts
    const originalAccountId = originalAccount.account_number?.replace(/-/g, '');
    const limitAccountId = `${originalAccountId}${CREDIT_LIMIT_SUFFIX}`;
    const availableAccountId = `${originalAccountId}${AVAILABLE_FUNDS_SUFFIX}`;

    let availableBalance = Math.abs(cleanNumber(originalAccount.account_available))
    let limitBalance = Math.abs(cleanNumber(originalAccount.account_balance));
    limitBalance += availableBalance
    availableBalance = -availableBalance

    // Create limit account
    const limitAccount = {
        // ...originalAccount,
        account_id: limitAccountId,
        account_name: `${originalAccount.account_name} (Limit)`,
        account_number: limitAccountId,
        account_balance: limitBalance,
        interest_rate: interestRateDecimal
    };

    // Create available account
    const availableAccount = {
        // ...originalAccount,
        account_id: availableAccountId,
        account_name: `${originalAccount.account_name} (Available)`,
        account_number: availableAccountId,
        account_balance: availableBalance
    };

    // Replace original account with the two new accounts
    accountData.splice(accountIndex, 1, limitAccount, availableAccount);
    
    console.log(`Transformed mortgage account into limit and available accounts for ${originalAccount.account_name}`);
}

// extracts the interest rate using the iframe method.
async function scrapeInterestRateForAccount(frame) {
    // Now find elements within the frame
    logger.debug(`Locating 'Interest rate' text within the frame...`);
    const interestRateLabel = frame.getByText('Interest rate', { exact: true }).first();
    await interestRateLabel.waitFor({ state: 'visible', timeout: 10000 });
    logger.debug(`Found 'Interest rate' label.`);

    // Find the value in the immediately following sibling div
    const interestRateValueLocator = interestRateLabel.locator('xpath=following-sibling::div[1]');
    await interestRateValueLocator.waitFor({ state: 'visible', timeout: 10000 });

    const interestRateText = await interestRateValueLocator.textContent();
    logger.info(`Found interest rate text: ${interestRateText}`);

    // Clean and parse the rate
    const rate = parseFloat(interestRateText?.replace(/%$/, '').trim());
    if (!isNaN(rate)) {
        logger.debug(`Parsed interest rate: ${rate}%`);
        return rate / 100; // Convert percentage to decimal
    } else {
        logger.warn(`Could not parse interest rate from text: "${interestRateText}" at ${fullUrl}`);
        return null;
    }

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
 * Processes mortgage accounts found in the table data.
 * Scrapes interest rates, creates separate limit/available accounts, and saves balances.
 */
async function processMortgageAccountsOld(page, allAccountsData) {
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
async function processAccountDetailPageOld(page, accountName, accountData) {
    const currentUrl = page.url();

    console.log(`✅ Processed account: ${accountName}`);

    if (currentUrl.includes(MORTGAGE_ACCOUNT_PATH_PREFIX)) {
        console.log(`🏠 Identified as a mortgage account.`);
        processMortgageAccount(page, accountData);
        // TODO: scrape mortgage-specific info here
    } else {
        // console.log(`💳 Identified as a standard account.`);
        // TODO: scrape standard account info
    }

}
/** 
 * Saves the balances and attempts to create accounts for the processed data.
 */
async function saveBalancesAndInterest(processedTableData) {
    logger.info(`Saving balances/accounts for ${processedTableData.length} processed rows.`);
    const nowISO = DateTime.now().setZone("Australia/Sydney").toISO();

    for (const accountRow of processedTableData) {
        const accountId = accountRow['account_number']?.replace(/-/g, '');
        const balance = accountRow['account_balance'];
        const accountName = accountRow['account_name'];
        const accountType = accountRow['account_type'];

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

    await page.goto(`${baseUrl}/CMWeb/AccountInformation/AI/Balances.aspx`);
    await page.waitForLoadState('load');

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