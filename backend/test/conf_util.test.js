

describe('Utils', () => {
    let util
    beforeEach(() => {
        util = require('../src/Util');
    });

    test('should be instantiated correctly', () => {
        expect(util.generateSHAFromObject).toBeDefined();
        expect(util.interpolateTimeSeries).toBeDefined();
    });

    test('test SHA', () => {
        // const util = require('../src/Util');
        expect(util.generateSHAFromObject).toBeDefined();
        let obj = {
            'account': '123456 89765',
            'description': "DEPOSIT JENNY,DAVID        Transfer",
            'balance': '419.54'
        }
        let k = ['account', 'description', 'balance']
        let uniqueID = util.generateSHAFromObject({}, obj, k)
        expect(uniqueID).toBe("742b614f4cb15bf508e8aa5067bccd8d2b70070da0c2b77a53ff1fe593364f30");
    });

    test('should return an empty array when no data is provided', () => {
        const result = util.interpolateTimeSeries([]);
        expect(result).toEqual([]);
    });

    test('should return the same data when there is only one data point', () => {
        const input = [
            { datetime: '2025-03-09T00:00:00.000Z', balance: 100 }
        ];
        const result = util.interpolateTimeSeries(input);
        expect(result).toEqual(input);
    });

    test('should interpolate correctly with two data points', () => {
        const input = [
            { datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { datetime: '2025-03-09T01:00:00Z', balance: 200 }
        ];
        const result = util.interpolateTimeSeries(input);
        expect(result).toHaveLength(2); // 1 hour interval, so only 2 points should be returned
        expect(result[0].balance).toBe(100);
        expect(result[1].balance).toBe(200);
    });

    test('should interpolate correctly with three data points', () => {
        const input = [
            { datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { datetime: '2025-03-09T01:00:00Z', balance: 200 },
            { datetime: '2025-03-09T02:00:00Z', balance: 300 }
        ];
        const result = util.interpolateTimeSeries(input);
        expect(result).toHaveLength(3); // Each point is an hour apart, no need for interpolation
        expect(result[0].balance).toBe(100);
        expect(result[1].balance).toBe(200);
        expect(result[2].balance).toBe(300);
    });

    test('should interpolate correctly with ten data points', () => {
        const input = [
            { datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { datetime: '2025-03-09T01:00:00Z', balance: 150 },
            { datetime: '2025-03-09T02:00:00Z', balance: 200 },
            { datetime: '2025-03-09T03:00:00Z', balance: 250 },
            { datetime: '2025-03-09T04:00:00Z', balance: 300 },
            { datetime: '2025-03-09T05:00:00Z', balance: 350 },
            { datetime: '2025-03-09T06:00:00Z', balance: 400 },
            { datetime: '2025-03-09T07:00:00Z', balance: 450 },
            { datetime: '2025-03-09T08:00:00Z', balance: 500 },
            { datetime: '2025-03-09T09:00:00Z', balance: 550 }
        ];
        const result = util.interpolateTimeSeries(input);
        expect(result).toHaveLength(10); // No interpolation needed
        expect(result[0].balance).toBe(100);
        expect(result[1].balance).toBe(150);
        expect(result[9].balance).toBe(550);
    });

    // New test for weekly interpolation (1 year apart)
    test('should interpolate weekly when the input range is 1 year apart', () => {
        const input = [
            { datetime: '2025-03-09T00:00:00.000Z', balance: 100 },
            { datetime: '2026-03-09T00:00:00.000Z', balance: 200 }
        ];
        const result = util.interpolateTimeSeries(input);

        // Expect weekly intervals (52 weeks in a year)
        expect(result).toHaveLength(53); // One extra point to include the start and end points
        expect(result[0].balance).toBe(100);
        expect(result[result.length - 1].balance).toBe(200);

        // Verify weekly intervals
        for (let i = 1; i < result.length - 1; i++) {
            const prevDate = new Date(result[i - 1].datetime);
            const currDate = new Date(result[i].datetime);
            const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24 * 7); // Difference in weeks
            expect(diff).toBe(1); // Check that the difference between consecutive dates is 1 week
        }
    });
});