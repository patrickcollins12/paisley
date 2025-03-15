import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";

import { graphic } from 'echarts';
const { LinearGradient } = graphic;

import { useResolvedTheme } from "@/components/theme-provider";
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";

import { formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";


const AccountBalanceChart = ({ accountid, category, startDate }) => {
    const resolvedTheme = useResolvedTheme();
    const [option, setOption] = useState({});                   // echarts options

    // // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountHistoryData(
        {
            accountid: accountid,
            from: startDate,
            interpolate: false
        });

    useEffect(() => {
        if (data && !isLoading) {

            const seriesData = generateEChartSeries(data);

            // const updatedData = updateBalances(data);
            // const balances = updatedData.balances
            // const dates = updatedData.dates

            setOption({
                legend: {
                    data: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']
                },

                tooltip: {
                    trigger: 'axis',
                    // formatter: '{b0}<br>${c0}',
                    formatter: function (params) {
                        const date = params[0]?.data[0]
                        const val = params[0]?.data[1]
                        return `${formatDate(date)}<br><b>Balance: ${formatCurrency(val)}</b>`
                    },
                    // formatter: function (params) {
                    //     const key = params[0]?.data[0]
                    //     const val = Math.abs(params[0]?.data[1])
                    //     return `${key}<br><b>transactions: ${val}</b>`
                    // },
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985',
                        },
                    }

                },

                feature: {
                    dataZoom: {
                        // yAxisIndex: 'none'
                    },
                },
                dataZoom: [
                    {
                        show: false,
                        realtime: false,
                        start: 0,
                        end: 100,
                        xAxisIndex: [0, 1]
                    },
                ],
                grid: {
                    left: '0%',
                    right: '0%',
                    bottom: '0%',
                    top: '0%',
                    containLabel: false
                },

                
                xAxis: [
                    {
                        show: false,
                        type: 'time',
                        boundaryGap: true,
                        // data: data.map(item => item.datetime)
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        show: false,
                        // min: "dataMin",
                        min: function (value) {
                            return category === "liability" ?
                                value.min + value.min * 0.01 :
                                value.min - ((value.max - value.min) * 0.4)
                        },
                        max: function (value) {
                            return category === "liability" ?
                                value.max - ((value.min - value.max) * 0.4) :
                                value.max + (value.max * 0.01)

                        }
                    }
                ],

                series: seriesData

            });
        }
    }, [data]);


    function generateEChartSeries(data) {
        const groupedData = {};

        // Group by accountid
        data.forEach(item => {
            if (!groupedData[item.accountid]) {
                groupedData[item.accountid] = [];
            }
            groupedData[item.accountid].push([item.datetime, item.balance]);
        });

        // Sort series by last value (largest to smallest)
        const sortedEntries = Object.entries(groupedData).sort((a, b) => {
            const lastA = a[1][a[1].length - 1][1]; // Last balance value
            const lastB = b[1][b[1].length - 1][1]; // Last balance value
            return lastA - lastB; // Descending order
        });

        const colorPalette = [
            "rgb(63, 182, 97)",   // Primary Green
            "rgb(56, 140, 90)",   // Darker Green (shade)
            "rgb(113, 204, 46)",  // Yellow-Green (Analogous)
            "rgb(26, 188, 156)",  // Teal (Split Complementary)
            "rgb(39, 174, 228)",  // Blue (Triadic)
            "rgb(142, 68, 173)",  // Purple (Triadic)
            "rgb(211, 84, 0)",    // Warm Orange (Split Complementary)
            "rgb(230, 126, 34)",  // Soft Orange (Analogous)
            "rgb(241, 196, 15)",  // Golden Yellow (Analogous)
            "rgb(189, 195, 199)"  // Neutral Silver (for balance)
        ];

        const series = sortedEntries.map(([accountid, seriesData], index) => {
            const color = colorPalette[index % colorPalette.length]; // Cycle through colors

            return {
                name: `Account ${accountid}`,
                type: 'line',
                stack: 'Total',
                smooth: false,
                lineStyle: {
                    width: 2,
                    color: color
                },
                showSymbol: false,
                emphasis: {
                    focus: 'series'
                },

                areaStyle: {
                    opacity: 0.9,
                    color: new LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: color }, // Solid color at the top
                        { offset: 1, color: color.replace("rgb", "rgba").replace(")", ", 0)") } // Faded color at the bottom
                    ])
                },
                data: seriesData
            };
        });

        return series;
    }


    return (
        <>
            {option && (
                <ReactECharts
                    option={option}
                    style={{ width: "100%", height: "100%" }}
                    lazyUpdate={true}
                    theme={{ resolvedTheme }}
                />
            )}

        </>
    )
};

export default AccountBalanceChart;
