

describe('Utils', () => {
    let util
    beforeEach(() => {
        // util = require('../src/Util');
        util = require('../src/AccountHistoryDataTransform');

    });

    test('should be instantiated correctly', () => {
        expect(util.normalizeTimeSeries).toBeDefined();
    });

    test('should return an empty array when no data is provided', () => {
        const result = util.normalizeTimeSeries([]);
        expect(result).toEqual([]);
    });

    test('should return the same data when there is only one data point', () => {
        const input = [
            { accountid: 'acc1', datetime: '2025-03-09T00:00:00.000Z', balance: 100, is_reference: 0 } // Added accountid and is_reference
        ];
        const result = util.normalizeTimeSeries(input);
        expect(result).toHaveLength(1);
        expect(result[0].accountid).toEqual('acc1');
        expect(result[0].series).toHaveLength(1); // Even with interpolation, a single point remains single
        expect(result[0].series[0][0]).toEqual(input[0].datetime);
        expect(result[0].series[0][1]).toEqual(input[0].balance);
    });

    test('should interpolate correctly with two data points', () => {
        const input = [
            { accountid: 'acc1', datetime: '2025-03-09T00:00:00Z', balance: 100, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T01:00:00Z', balance: 200, is_reference: 0 }
        ];
        const result = util.normalizeTimeSeries(input);
        const answer = result[0].series;
        // Hourly interval for < 7 days
        expect(answer).toHaveLength(2); // Start and end hour
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(200);
    });

    test('should interpolate correctly with three data points', () => {
        const input = [
            { accountid: 'acc1', datetime: '2025-03-09T00:00:00Z', balance: 100, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T01:00:00Z', balance: 200, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T02:00:00Z', balance: 300, is_reference: 0 }
        ];
        const result = util.normalizeTimeSeries(input);
        const answer = result[0].series;

        expect(answer).toHaveLength(3); // Hourly interval, matches input points
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(200);
        expect(answer[2][1]).toBe(300);
    });

    test('should interpolate correctly with ten data points', () => {
        const input = [
            { accountid: 'acc1', datetime: '2025-03-09T00:00:00Z', balance: 100, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T01:00:00Z', balance: 150, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T02:00:00Z', balance: 200, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T03:00:00Z', balance: 250, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T04:00:00Z', balance: 300, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T05:00:00Z', balance: 350, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T06:00:00Z', balance: 400, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T07:00:00Z', balance: 450, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T08:00:00Z', balance: 500, is_reference: 0 },
            { accountid: 'acc1', datetime: '2025-03-09T09:00:00Z', balance: 550, is_reference: 0 }
        ];
        const result = util.normalizeTimeSeries(input);
        const answer = result[0].series;

        expect(answer).toHaveLength(10); // Hourly interval matches input points
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(150);
        expect(answer[9][1]).toBe(550);
    });

    // New test for weekly interpolation (1 year apart)
    test('should interpolate weekly when the input range is 1 year apart', () => {
        const input = [
            { accountid: 'acc1', datetime: '2025-03-09T00:00:00.000Z', balance: 100, is_reference: 0 },
            { accountid: 'acc1', datetime: '2026-03-09T00:00:00.000Z', balance: 200, is_reference: 0 }
        ];
        const result = util.normalizeTimeSeries(input);
        const answer = result[0].series;

        // Expect weekly intervals (approx 52 weeks + start point)
        expect(answer.length).toBeGreaterThanOrEqual(52);
        expect(answer.length).toBeLessThanOrEqual(54); // Allow for slight variation
        expect(answer[0][1]).toBe(100);
        // Note: We removed the forcing of the last point, so interpolation might make it slightly off 200
        expect(answer[answer.length - 1][1]).toBeCloseTo(200);

        // Verify weekly intervals
        // Verify weekly intervals (check first few intervals)
        const weekSeconds = 7 * 24 * 60 * 60;
        for (let i = 1; i < Math.min(answer.length, 5); i++) { // Check first few
            const prevTime = new Date(answer[i - 1][0]).getTime() / 1000;
            const currTime = new Date(answer[i][0]).getTime() / 1000;
            const diff = currTime - prevTime;
            expect(diff).toBeCloseTo(weekSeconds, 0); // Check interval is close to a week
        }
    });
});