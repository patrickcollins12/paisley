import React, { useMemo } from "react";
import { DateTime } from 'luxon'
import { Sparklines, SparklinesLine } from 'react-sparklines';
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
import { useResolvedTheme } from "@/components/theme-provider";

export default function AccountSparkLine({ accountid }) {
    const resolvedTheme = useResolvedTheme();

    // date from 12 months ago
    // Memoize startDate to avoid recalculating on each render
    const startDate = useMemo(() => DateTime.now().minus({ months: 12 }).toISO(), []);

    const { data, error, isLoading } = useAccountHistoryData({accountid, from:startDate, interpolate:true});

    return (
        <div>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                data && (
                    // extract the balance data from the response
                    // and pass it to the Sparklines component
                    // Examples: http://borisyankov.github.io/react-sparklines/
                    <Sparklines data={data.map((item) => item.balance)} svgWidth={70} svgHeight={16}>
                        <SparklinesLine color={resolvedTheme == "dark" ? 'rgb(63, 182, 97)' : 'rgb(63, 182, 97)'} style={{ strokeWidth: 6 }} />
                    </Sparklines>
                )
            )}
        </div>
    );
} 
