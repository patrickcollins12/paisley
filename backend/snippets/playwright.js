const { chromium } = require('playwright');  // Or 'firefox' or 'webkit'.

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://google.com');
  // other actions...
  await browser.close();
})();
