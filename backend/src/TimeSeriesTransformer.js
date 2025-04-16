class TimeSeriesTransformer {
    static normalizeTimeSeries(data, interpolate = true) {
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
        Object.values(groupedData).forEach(series => 
            series.sort((a, b) => new Date(a[0]) - new Date(b[0]))
        );

        // If interpolation is not needed, return the grouped data directly
        if (!interpolate) {
            return Object.entries(groupedData).map(([accountid, series]) => ({ accountid, series }));
        }

        // Step 3: Interpolate all series to a common time range
        const intervalSec = this.determineInterval(startDate, endDate);
        const commonTimeSeries = this.generateCommonTimeSeries(startDate, endDate, intervalSec);

        return Object.entries(groupedData).map(([accountid, series]) => ({
            accountid,
            series: this.interpolateSeries(series, commonTimeSeries)
        }));
    }

    static determineInterval(startDate, endDate) {
        const totalDurationSec = endDate - startDate;
        if (totalDurationSec <= 45 * 24 * 60 * 60) return 60 * 60; // Hourly for < 45 days
        if (totalDurationSec <= 1 * 365 * 24 * 60 * 60) return 24 * 60 * 60; // Daily for 1 year
        if (totalDurationSec <= 5 * 365 * 24 * 60 * 60) return 7 * 24 * 60 * 60; // Weekly for < 5 years
        return 30 * 24 * 60 * 60; // Monthly otherwise
    }

    static generateCommonTimeSeries(startDate, endDate, intervalSec) {
        const series = [];
        for (let currentTime = startDate; currentTime <= endDate; currentTime += intervalSec) {
            series.push(new Date(currentTime * 1000).toISOString());
        }
        return series;
    }

    static interpolateSeries(accountSeries, commonTimeSeries) {
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
}

module.exports = TimeSeriesTransformer;
