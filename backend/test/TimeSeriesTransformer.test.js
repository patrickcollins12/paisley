const TimeSeriesTransformer = require('../src/TimeSeriesTransformer');

describe('TimeSeriesTransformer', () => {
    test('should be instantiated correctly', () => {
        expect(TimeSeriesTransformer.normalizeTimeSeries).toBeDefined();
    });

    test('should return an empty array when no data is provided', () => {
        const result = TimeSeriesTransformer.normalizeTimeSeries([]);
        expect(result).toEqual([]);
    });

    test('should return the same data when there is only one data point', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00.000Z', balance: 100 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        const answer = result[0].series[0];
        expect(answer[0]).toEqual(input[0].datetime);
        expect(answer[1]).toEqual(input[0].balance);
    });

    test('should interpolate correctly with two data points', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { accountid: 'TEST001', datetime: '2025-03-09T01:00:00Z', balance: 200 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        const answer = result[0].series;
        expect(answer).toHaveLength(2); // 1 hour interval, so only 2 points should be returned
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(200);
    });

    test('should interpolate correctly with three data points', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { accountid: 'TEST001', datetime: '2025-03-09T01:00:00Z', balance: 200 },
            { accountid: 'TEST001', datetime: '2025-03-09T02:00:00Z', balance: 300 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        const answer = result[0].series;

        expect(answer).toHaveLength(3); // Each point is an hour apart, no need for interpolation
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(200);
        expect(answer[2][1]).toBe(300);
    });

    test('should interpolate correctly with ten data points', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { accountid: 'TEST001', datetime: '2025-03-09T01:00:00Z', balance: 150 },
            { accountid: 'TEST001', datetime: '2025-03-09T02:00:00Z', balance: 200 },
            { accountid: 'TEST001', datetime: '2025-03-09T03:00:00Z', balance: 250 },
            { accountid: 'TEST001', datetime: '2025-03-09T04:00:00Z', balance: 300 },
            { accountid: 'TEST001', datetime: '2025-03-09T05:00:00Z', balance: 350 },
            { accountid: 'TEST001', datetime: '2025-03-09T06:00:00Z', balance: 400 },
            { accountid: 'TEST001', datetime: '2025-03-09T07:00:00Z', balance: 450 },
            { accountid: 'TEST001', datetime: '2025-03-09T08:00:00Z', balance: 500 },
            { accountid: 'TEST001', datetime: '2025-03-09T09:00:00Z', balance: 550 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        const answer = result[0].series;

        expect(answer).toHaveLength(10); // No interpolation needed
        expect(answer[0][1]).toBe(100);
        expect(answer[1][1]).toBe(150);
        expect(answer[9][1]).toBe(550);
    });

    test('should interpolate weekly when the input range is 1 year apart', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00.000Z', balance: 100 },
            { accountid: 'TEST001', datetime: '2026-03-09T00:00:00.000Z', balance: 200 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        const answer = result[0].series;

        // Expect weekly intervals (52 weeks in a year)
        expect(answer).toHaveLength(53); // One extra point to include the start and end points
        expect(answer[0][1]).toBe(100);
        expect(answer[answer.length - 1][1]).toBe(200);

        // Verify weekly intervals
        for (let i = 1; i < answer.length - 1; i++) {
            const prevDate = new Date(answer[i - 1][0]);
            const currDate = new Date(answer[i][0]);
            const diff = (currDate - prevDate) / (1000 * 60 * 60 * 24 * 7); // Difference in weeks
            expect(diff).toBe(1); // Check that the difference between consecutive dates is 1 week
        }
    });

    test('should handle multiple accounts correctly', () => {
        const input = [
            { accountid: 'TEST001', datetime: '2025-03-09T00:00:00Z', balance: 100 },
            { accountid: 'TEST001', datetime: '2025-03-09T01:00:00Z', balance: 200 },
            { accountid: 'TEST002', datetime: '2025-03-09T00:00:00Z', balance: 300 },
            { accountid: 'TEST002', datetime: '2025-03-09T01:00:00Z', balance: 400 }
        ];
        const result = TimeSeriesTransformer.normalizeTimeSeries(input);
        
        expect(result).toHaveLength(2); // Two accounts
        expect(result[0].accountid).toBe('TEST001');
        expect(result[1].accountid).toBe('TEST002');
        
        expect(result[0].series).toHaveLength(2);
        expect(result[1].series).toHaveLength(2);
        
        expect(result[0].series[0][1]).toBe(100);
        expect(result[0].series[1][1]).toBe(200);
        expect(result[1].series[0][1]).toBe(300);
        expect(result[1].series[1][1]).toBe(400);
    });
});