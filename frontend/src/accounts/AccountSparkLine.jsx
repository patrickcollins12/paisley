import React, { useMemo } from "react";
import { DateTime } from 'luxon';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
import { useResolvedTheme } from "@/components/theme-provider";

// Function to sum balances across all accounts
function sumBalancesOnly(data) {
    if (!data || data.length === 0) return [];
    const summedBalances = [];

    data.forEach(account => {
        account.series.forEach(([_, balance], index) => {
            summedBalances[index] = (summedBalances[index] || 0) + balance;
        });
    });

    return summedBalances;
}

export default function AccountSparkLine({ accountid }) {
    const resolvedTheme = useResolvedTheme();

    // Date from 12 months ago (memoized)
    const startDate = useMemo(() => DateTime.now().minus({ months: 12 }).toISO(), []);

    // Fetch account history data
    const { data, error, isLoading } = useAccountHistoryData({ accountid, from: startDate, interpolate: true });

    // Process data: sum balances only
    const processedData = useMemo(() => (data ? sumBalancesOnly(data) : []), [data]);

    return (
        <div>
            {isLoading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error loading data</div>
            ) : processedData.length > 0 ? (
                <Sparklines data={processedData} svgWidth={70} svgHeight={16}>
                    <SparklinesLine color={resolvedTheme === "dark" ? 'rgb(63, 182, 97)' : 'rgb(63, 182, 97)'} style={{ strokeWidth: 6 }} />
                </Sparklines>
            ) : (
                <div></div>
            )}
        </div>
    );
}
