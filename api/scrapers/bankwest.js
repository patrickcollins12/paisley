import { test } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../ConfigLoader');
const bank_config = config['BankwestScraper'];

test('test', async ({ page }) => {
  test.slow();

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

  await util.saveCSVFromPromise(bank_config, config['csv_watch'], download)

});
