

exports.normalizeTimeSeries = function (data, interpolate = true) {
    if (!data || data.length === 0) return [];

    // Step 1: Find min & max datetime in dataset
    const timestamps = data.map(entry => new Date(entry.datetime).getTime() / 1000);
    const startDate = Math.floor(Math.min(...timestamps));
    const endDate = Math.floor(Math.max(...timestamps));
    
    // Step 2: Group data by accountid
    const groupedData = {};
    data.forEach(({ accountid, datetime, balance }) => {
        if (!groupedData[accountid]) {
            groupedData[accountid] = [];
        }
        groupedData[accountid].push([datetime, balance]);
    });

    // Sort each account's series by datetime
    Object.values(groupedData).forEach(series => series.sort((a, b) => new Date(a[0]) - new Date(b[0])));

    // If interpolation is not needed, return the grouped data directly
    if (!interpolate) {
        return Object.entries(groupedData).map(([accountid, series]) => ({ accountid, series }));
    }

    // Step 3: Interpolate all series to a common time range
    const intervalSec = determineInterval(startDate, endDate);
    const commonTimeSeries = generateCommonTimeSeries(startDate, endDate, intervalSec);

    const interpolatedResult = Object.entries(groupedData).map(([accountid, series]) => ({
        accountid,
        series: interpolateSeries(series, commonTimeSeries)
    }));

    return interpolatedResult;
};

/**
 * Determines the appropriate interpolation interval based on the time range.
 */
function determineInterval(startDate, endDate) {
    const totalDurationSec = endDate - startDate;
    if (totalDurationSec <= 7 * 24 * 60 * 60) return 60 * 60; // Hourly for < 7 days
    if (totalDurationSec <= 30 * 24 * 60 * 60) return 24 * 60 * 60; // Daily for < 1 month
    if (totalDurationSec <= 5 * 365 * 24 * 60 * 60) return 7 * 24 * 60 * 60; // Weekly for < 5 years
    return 30 * 24 * 60 * 60; // Monthly otherwise
}

/**
 * Generates a common time series based on start, end, and interval.
 */
function generateCommonTimeSeries(startDate, endDate, intervalSec) {
    const timeSeries = [];
    for (let currentTime = startDate; currentTime <= endDate; currentTime += intervalSec) {
        timeSeries.push(new Date(currentTime * 1000).toISOString());
    }
    return timeSeries;
}

/**
 * Interpolates a single account's time series to a common time series.
 */
function interpolateSeries(accountSeries, commonTimeSeries) {
    const series = [];
    let prevIndex = 0;

    commonTimeSeries.forEach(time => {
        const currentTime = Math.floor(new Date(time).getTime() / 1000);

        while (
            prevIndex < accountSeries.length - 1 &&
            Math.floor(new Date(accountSeries[prevIndex + 1][0]).getTime() / 1000) < currentTime
        ) {
            prevIndex++;
        }

        const prevPoint = accountSeries[prevIndex];
        const nextPoint = accountSeries[Math.min(prevIndex + 1, accountSeries.length - 1)];

        const prevTime = Math.floor(new Date(prevPoint[0]).getTime() / 1000);
        const nextTime = Math.floor(new Date(nextPoint[0]).getTime() / 1000);

        let interpolatedBalance;
        if (prevTime === nextTime) {
            interpolatedBalance = prevPoint[1];
        } else {
            const t = (currentTime - prevTime) / (nextTime - prevTime);
            interpolatedBalance = Math.round((prevPoint[1] + t * (nextPoint[1] - prevPoint[1])) * 1e12) / 1e12;
        }

        series.push([time, interpolatedBalance]);
    });

    // Ensure last point is exact
    if (series.length > 0) {
        series[series.length - 1][1] = accountSeries[accountSeries.length - 1][1];
    }

    return series;
}

















/**
 * Interpolates time series data for multiple accounts to a common time series.
 *
 * @param {Array} data - An array of objects representing the time series data for multiple accounts. Each object should have the following properties:
 *   - accountid: The ID of the account.
 *   - datetime: The timestamp of the data point in ISO format.
 *   - balance: The balance value at the given timestamp.
 * @returns {Array} An array of objects, each representing the interpolated time series for an account. Each object has the following properties:
 *   - accountid: The ID of the account.
 *   - series: An array of arrays, where each inner array contains a timestamp (ISO format) and the interpolated balance value at that timestamp.
 */
exports.interpolateTimeSeriesOld = function (data) {
    if (!data || data.length === 0) return [];

    // Group data by accountid
    const groupedData = {};
    data.forEach(entry => {
        if (!groupedData[entry.accountid]) {
            groupedData[entry.accountid] = [];
        }
        groupedData[entry.accountid].push(entry);
    });

    // Sort each account's data by datetime
    Object.values(groupedData).forEach(accountData => {
        accountData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    });

    // Determine global time range (to align all accounts)
    const allDates = data.map(entry => new Date(entry.datetime).getTime() / 1000);
    const startDate = Math.floor(Math.min(...allDates));
    const endDate = Math.floor(Math.max(...allDates));
    const totalDurationSec = endDate - startDate;

    // Choose interpolation interval
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

    // Generate common time intervals for all accounts
    const commonTimeSeries = [];
    for (let currentTime = startDate; currentTime <= endDate; currentTime += intervalSec) {
        commonTimeSeries.push(new Date(currentTime * 1000).toISOString());
    }

    // Function to interpolate balances
    function interpolate(accountData, commonTimeSeries) {
        const series = [];
        let prevIndex = 0;

        commonTimeSeries.forEach(time => {
            const currentTime = Math.floor(new Date(time).getTime() / 1000);

            while (
                prevIndex < accountData.length - 1 &&
                Math.floor(new Date(accountData[prevIndex + 1].datetime).getTime() / 1000) < currentTime
            ) {
                prevIndex++;
            }

            const prevPoint = accountData[prevIndex];
            const nextPoint = accountData[Math.min(prevIndex + 1, accountData.length - 1)];

            const prevTime = Math.floor(new Date(prevPoint.datetime).getTime() / 1000);
            const nextTime = Math.floor(new Date(nextPoint.datetime).getTime() / 1000);

            let interpolatedBalance;
            if (prevTime === nextTime) {
                interpolatedBalance = prevPoint.balance;
            } else {
                const t = (currentTime - prevTime) / (nextTime - prevTime);
                interpolatedBalance = Math.round((prevPoint.balance + t * (nextPoint.balance - prevPoint.balance)) * 1e12) / 1e12;
            }

            series.push([time, interpolatedBalance]);
        });

        // Ensure last point is exact
        if (series.length > 0) {
            series[series.length - 1][1] = accountData[accountData.length - 1].balance;
        }

        return series;
    }

    // Process each account's data
    const result = Object.entries(groupedData).map(([accountid, accountData]) => ({
        accountid,
        series: interpolate(accountData, commonTimeSeries)
    }));

    return result;
};
