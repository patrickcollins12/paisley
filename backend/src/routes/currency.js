const express = require('express');
const axios = require('axios');
const { DateTime } = require('luxon');
const { query, validationResult } = require('express-validator');
const router = express.Router();
const KeyValueStore = require('../KeyValueStore');
const store = new KeyValueStore();
const logger = require('../logger'); // Ensure you have a logger module

/*
OK before I park this here is where I got up to.
fawazahmed0's system only goes back about a year. it's not the best.
ideally this API would include a couple other reliable sources. The two best I found were:
    - US Treasury. Only has quarterly data and needs mapping from random country names to ISO 4217 codes.
        https://www.fiscal.treasury.gov/reports-statements/treasury-reporting-rates-exchange
    - Exchange Rates API is $8 per month and good API, but costs money.
        https://exchangeratesapi.io/#pricing_plan

Secondly, because this data is stored in the key store it doesn't allow us us to find the 
closest interest rate to the date requested. This would be a nice upgrade. It would need a custom 
table I think.
*/

// Validation middleware
const validateCurrencyQuery = [
  query('base')
    .isAlpha()
    .isLength({ min: 3, max: 20 })
    .toLowerCase()
    .withMessage('Base currency must be a 3-20 letter alphabetic code.'),
  query('target')
    .isAlpha()
    .isLength({ min: 3, max: 20 })
    .toLowerCase()
    .withMessage('Target currency must be a 3-20 letter alphabetic code.'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD ISO8601 format.')
];

// Helper function to fetch exchange rates
const fetchExchangeRate = async (base, target, date) => {
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${base}.json`;
  try {
    const response = await axios.get(url);
    logger.info(`Fetched data from URL: ${url}`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching data from URL: ${url} - ${error.message}`);
    throw error;
  }
};

// Route handler
router.get('/api/currency', validateCurrencyQuery, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { base, target, date } = req.query;
  const queryDate = date
    ? DateTime.fromISO(date).toUTC().toFormat('yyyy-MM-dd')
    : DateTime.utc().toFormat('yyyy-MM-dd');
  const cacheKey = `${base}_${target}_${queryDate}`;

  try {
    // Check cache
    let exchangeData = store.getKey('currency', cacheKey);
    if (exchangeData) {
      logger.info(`Cache hit for key: ${cacheKey}`);
      const cacheJson = JSON.parse(exchangeData)
      cacheJson.source = 'cache';
      return res.json(cacheJson);
    }

    // Attempt to fetch data for the specified date
    try {
      const data = await fetchExchangeRate(base, target, queryDate);
      if (data[base] && data[base][target]) {
        exchangeData = {
          date: data.date,
          rate: data[base][target]
        };
        store.setKey('currency', cacheKey, JSON.stringify(exchangeData));
        exchangeData.source = 'web';
        return res.json(exchangeData);
      } else {
        logger.warn(`Exchange rate from ${base} to ${target} not found for date ${queryDate}`);
        return res.status(404).json({ error: `Exchange rate for ${base.toUpperCase()} to ${target.toUpperCase()} not found on ${queryDate}` });
      }
    } catch (error) {
      // If fetching by date fails and it's after UTC midnight, fallback to latest
      const nowUTC = DateTime.utc();
      if (nowUTC.hour > 0 || nowUTC.minute > 0 || nowUTC.second > 0) {
        logger.info('Falling back to latest exchange rate data.');
        const latestData = await fetchExchangeRate(base, target, 'latest');
        if (latestData[base] && latestData[base][target]) {
          exchangeData = {
            date: latestData.date,
            rate: latestData[base][target]
          };
          store.setKey('currency', `${base}_${target}_${latestData.date}`, JSON.stringify(exchangeData));
          exchangeData.source = 'web';
          return res.json(exchangeData);
        } else {
          logger.warn(`Exchange rate from ${base} to ${target} not found in latest data.`);
          return res.status(404).json({ error: `Exchange rate for ${base.toUpperCase()} to ${target.toUpperCase()} not found in latest data.` });
        }
      } else {
        logger.error('Failed to fetch exchange rate data and fallback not attempted due to timing.');
        return res.status(502).json({ error: 'Failed to fetch exchange rate data from external API, and fallback not attempted due to timing.' });
      }
    }
  } catch (error) {
    logger.error(`An internal server error occurred: ${error.message}`);
    return res.status(500).json({ error: 'An internal server error occurred while processing the exchange rate.' });
  }
});

module.exports = router;
