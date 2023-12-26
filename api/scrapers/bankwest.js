import { test } from '@playwright/test';
const path = require('path');

const ConfigManager = require('../ConfigManager.js');
const configManager = new ConfigManager('pfm');
const config = configManager.readConfig();
const bank_config = config['BankwestScraper'];

test('test', async ({ page }) => {
  await page.goto('https://ibs.bankwest.com.au/Session/PersonalLogin');
  await page.getByRole('textbox', { name: 'Personal Access Number (PAN)' }).fill(bank_config['pan']);
  await page.getByRole('textbox', { name: 'Password' }).fill(bank_config['password']);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Accounts' }).click();
  await page.getByRole('link', { name: 'Transaction search' }).click();
  await page.locator('[id="_ctl0_ContentMain_ddlAccount"]').selectOption('[All]');
  await page.locator('[id="_ctl0_ContentMain_ddlRangeOptions"]').selectOption('L30Days');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export' }).click();
  const download = await downloadPromise;

  // Wait for the download process to complete and save the downloaded file somewhere.
  const fileName = [bank_config['identifier'], process.pid, download.suggestedFilename()].join('_')
  let csv_location = path.join( config['csv_watch'], fileName );
  await download.saveAs(csv_location);
  console.log(`Saved to ${csv_location}`)

});
