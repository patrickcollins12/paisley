const os = require('os');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const config = require('./Config');
const logger = require('./Logger');
const axios = require('axios').default;

/**
 * Cleans a price string by removing all non-numeric characters except decimals.
 * @param {string} price - The price string to clean.
 * @returns {string} - The cleaned price.
 */
function cleanPrice(price) {
    return price.replace(/[^0-9.]/g, "");
}

/**
 * Saves a downloaded file as a CSV.
 * @param {object} config - The config object containing identifiers.
 * @param {string} dir - The directory to save the file in.
 * @param {object} download - The download object containing file metadata.
 */
async function saveCSVFromPromise(config, dir, download) {
    const fileName = [config['identifier'], process.pid, download.suggestedFilename()].join('_');
    let csv_location = path.join(dir, fileName);
    await download.saveAs(csv_location);
    logger.info(`Saved to ${csv_location}`);
}

/**
 * Saves an array of data to a CSV file.
 * @param {string} filename - The output CSV filename.
 * @param {Array} data - The data to be written to the CSV.
 */
async function saveDataToCSV(filename, data) {
    if (!data || data.length === 0) {
        logger.error('No data to write');
        throw new Error("Empty data object, no CSV to write");
    }

    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));

    const csvWriter = createCsvWriter({
        path: filename,
        header: headers
    });

    await csvWriter.writeRecords(data);
}


////////////////////////
//Save to paisley account_history the balance
async function saveToPaisley(path, payload) {
    try {
        config.load()

        const url = `${config['paisleyUrl']}${path}`
        // logger.info(`Calling URL: ${url} with payload:\n ${JSON.stringify(payload, null, 2)}`)

        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': config['paisleyApiKey'],
                'Content-Type': 'application/json'
            }
        });

        logger.info('Successfully updated account metadata:', response.data);
        return response.data;

    } catch (error) {
        logger.error('Error saving data to Paisley:', error.response?.data || error.message);
        throw error;
    }
}


module.exports = { cleanPrice, saveCSVFromPromise, saveDataToCSV, saveToPaisley};
