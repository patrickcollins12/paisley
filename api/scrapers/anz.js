import { test } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../Config');
const bank_config = config['AnzScraper'];

test('test-anz', async ({ page }) => {
  test.slow();

  // complete the login form
  await page.goto('https://login.anz.com/internetbanking');
  await page.locator("#customerRegistrationNumber").fill(bank_config.username);
  await page.locator("#password").fill(bank_config.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // wait for the home page to load
  await page.waitForURL("**/IBUI/#/home");

  // navigate to transaction download page
  // note: this HAS to be done by going through one of the account pages first
  await page.getByTestId("list-item-home-screen-list-display-0").click();
  await page.getByTestId("icon_link").filter({ hasText: 'Download' }).click();

  // TODO: Actually traverse all accounts to download statements
  // Simply download the L30D for the first account listed in the account drop down
  await page.getByTestId('drop-down-search-transaction-account1-dropdown-field').click();
  await page.getByTestId('drop-down-search-transaction-account1-dropdown-result-5').click();
  await page.getByTestId('footer-primary-button_button', { name: 'Download' }).click();
  const download = await page.waitForEvent('download');

  // Save the downloaded file
  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download);

});
