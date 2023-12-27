import { test, expect } from '@playwright/test';
const os = require('os');
const path = require('path');

const config = require('../ConfigLoader');
const bank_config = config['RestSuperScraper'];

test('test', async ({ page }) => {
  test.slow();

  await page.goto('https://rest.com.au/');
  await page.getByRole('button', { name: 'C Login N' }).click();
  await page.getByRole('link', { name: 'C Member login' }).click();
  await page.getByRole('textbox').fill('pcollins1@gmail.com');
  await page.getByRole('textbox').press('Enter');
  await page.locator('input[type="password"]').fill('6PamzZU9wkGebstP');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Member Access' }).click();
//   await page.waitForSelector('text=Your Current Balance as at')

  await expect(page.getByText('Your Current Balance as at')).toBeVisible({ timeout: 60000 });
//   let x = await page.getByText(/Your Current Balance as at ([\d\/]+) is:/i);
  console.log(await page.textContent('.currentBalanceText'));
//   console.log(x);

//   <div>
//     <div class="controlHeader">
// Mr 
// Patrick Dewar 
// Collins
//     </div>

//         <div id="currentBalanceText">
//             Your Current Balance as at 27/12/2023 is:
//         </div>
//         <div id="prominentCurrentBalance">
//             $509,148.03
//         </div>



// </div>



//   const fileName = [bank_config['identifier'], process.pid, download.suggestedFilename()].join('_')
//   let csv_location = path.join( config['csv_watch'], fileName );
//   await download.saveAs(csv_location);
//   console.log(`Saved to ${csv_location}`)
});

