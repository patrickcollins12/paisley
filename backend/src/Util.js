const crypto = require('crypto');

/**
 * Creates a 64-character SHA256 hash key from an input object based on specified keys of interest.
 *
 * @param {Object} obj - The input object from which to generate the hash.
 * @param {string[]} keysOfInterest - An array of strings representing the keys in the object to be included in the hash.
 * @returns {string} A 64-character hexadecimal SHA256 hash string.
 */
// exports.generateSHAFromObject = function (obj, keysOfInterest) {
exports.generateSHAFromObject = function (orig, processed, keysOfInterest) {
    const obj = { ...orig, ...processed };

    let s = ""
    for (let k of keysOfInterest) {
        let val = obj[k]
        if ((k in obj)) {
            if (['description'].includes(k)) {
                // keep the same
            } else {
                val = val.toString().replace(/[^a-zA-Z0-9\.\,]/g, '');
            }
            s += val + ";"
        }
    }

    return crypto.createHash('sha256').update(s).digest('hex')
}


exports.interpolateTimeSeries = function (data) {
    if (!data || data.length === 0) return [];

    // Sort data by datetime
    data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    const startDate = Math.floor(new Date(data[0].datetime).getTime() / 1000);
    const endDate = Math.floor(new Date(data[data.length - 1].datetime).getTime() / 1000);
    const totalDurationSec = endDate - startDate;

    // Choose interval
    let intervalSec;
    if (totalDurationSec <= 7 * 24 * 60 * 60) {
        intervalSec = 60 * 60; // Hourly for < 7 days
    } else if (totalDurationSec <= 30 * 24 * 60 * 60) {
        intervalSec = 24 * 60 * 60; // Daily for < 1 month
    } else if (totalDurationSec <= 5 * 365 * 24 * 60 * 60) {
        intervalSec = 7 * 24 * 60 * 60; // Weekly for < 5 years
    } else {
        intervalSec = 30 * 24 * 60 * 60; // Monthly otherwise
    }

    const interpolatedData = [];
    let currentTime = startDate;
    let prevIndex = 0;

    while (currentTime <= endDate) {
        while (
            prevIndex < data.length - 1 &&
            Math.floor(new Date(data[prevIndex + 1].datetime).getTime() / 1000) < currentTime
        ) {
            prevIndex++;
        }

        const prevPoint = data[prevIndex];
        const nextPoint = data[Math.min(prevIndex + 1, data.length - 1)];

        const prevTime = Math.floor(new Date(prevPoint.datetime).getTime() / 1000);
        const nextTime = Math.floor(new Date(nextPoint.datetime).getTime() / 1000);

        let interpolatedBalance;
        if (prevTime === nextTime) {
            interpolatedBalance = prevPoint.balance;
        } else {
            const t = (currentTime - prevTime) / (nextTime - prevTime);
            interpolatedBalance = Math.round((prevPoint.balance + t * (nextPoint.balance - prevPoint.balance)) * 1e12) / 1e12;
        }

        interpolatedData.push({
            datetime: new Date(currentTime * 1000).toISOString(),
            balance: interpolatedBalance
        });

        currentTime += intervalSec;
    }

    if (interpolatedData.length > 0) {
        interpolatedData[interpolatedData.length - 1].balance = data[data.length - 1].balance;
    }
    
    return interpolatedData;
};
