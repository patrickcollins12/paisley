const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');

const getCountriesAndCurrencies = () => {
  // Create a readable stream from a local file
  const stream = fs.createReadStream('./country_data_formatted.json', { encoding: 'utf8' });

  // Set up the JSONStream to parse objects matching the path '*'
  const parser = JSONStream.parse('*');
  
  // Transform stream to process each country object
  const transformStream = es.mapSync(data => {
    if (data.name && data.currencies) {
      const countryName = data.name.common;
      const population = data.population;
      const currencies = Object.keys(data.currencies).map(currencyCode => ({
        code: currencyCode,
        name: data.currencies[currencyCode].name,
        symbol: data.currencies[currencyCode].symbol,
      }));
      console.log({ countryName, population, currencies });
    }
  });

  // Pipe the file stream through the parser and then through the transform stream
  stream.pipe(parser).pipe(transformStream);
};

getCountriesAndCurrencies();
