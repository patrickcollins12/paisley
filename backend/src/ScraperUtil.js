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
// Paisley API Helpers

async function _callPaisleyApi(method, apiPath, payload, id = null) {
    config.load();
    const baseUrl = config['paisleyUrl'];
    const apiKey = config['paisleyApiKey'];

    if (!baseUrl || !apiKey) {
        throw new Error("Paisley URL or API Key is missing from config.");
    }

    let url = `${baseUrl}${apiPath}`;
    if (id) {
        url += `/${id}`;
    }

    const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
    };

    // logger.info(`Calling ${method.toUpperCase()} ${url} with payload:\n ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await axios({
            method: method,
            url: url,
            data: payload,
            headers: headers
        });
        logger.info(`Success (${response.status}) calling ${method.toUpperCase()} on ${url}`);
        return response.data;
    } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const message = errorData?.message || (error.isAxiosError ? error.message : 'Unknown API call error');

        if ( message.includes("Account ID already exists")) {
            return
        }

        logger.error(`Failed (${status || 'N/A'}) calling ${method.toUpperCase()} on ${url}: ${message}`, errorData || '');
        const structuredError = new Error(`Paisley API Error (${status || 'N/A'}): ${message}`);
        structuredError.originalError = error;
        structuredError.responseData = errorData;
        structuredError.statusCode = status;
        throw structuredError;
    }
}

/**
 * Creates a resource in Paisley using POST.
 * @param {string} apiPath - The API path (e.g., '/api/accounts').
 * @param {object} payload - The data payload.
 * @returns {Promise<object>} - The API response data.
 */
async function createPaisleyResource(apiPath, payload) {
    return await _callPaisleyApi('post', apiPath, payload);
}

/**
 * Updates a resource in Paisley using PATCH.
 * @param {string} apiPath - The API path without the ID (e.g., '/api/accounts').
 * @param {string} id - The ID of the resource to update.
 * @param {object} payload - The data payload.
 * @returns {Promise<object>} - The API response data.
 */
async function updatePaisleyResource(apiPath, id, payload) {
    if (!id) throw new Error("ID must be provided for updatePaisleyResource");
    return await _callPaisleyApi('patch', apiPath, payload, id);
}

/**
 * Saves a balance record to Paisley (always uses POST).
 * @param {object} payload - The balance data payload (must include accountid).
 * @returns {Promise<object>} - The API response data.
 */
async function savePaisleyBalance(payload) {
    if (!payload.accountid) throw new Error("accountid is required in payload for savePaisleyBalance");
    // Balances are typically always new entries, so use POST
    return await _callPaisleyApi('post', '/api/account_balance', payload);
}

module.exports = { cleanPrice, saveCSVFromPromise, saveDataToCSV, createPaisleyResource, updatePaisleyResource, savePaisleyBalance };
