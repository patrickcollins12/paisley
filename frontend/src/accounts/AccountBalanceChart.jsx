import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";

import { graphic } from 'echarts';
const { LinearGradient } = graphic;

import { useResolvedTheme } from "@/components/theme-provider";
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
import useAccountData from "@/accounts/AccountApiHooks.js";

import { formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";


const AccountBalanceChart = ({ accountid, category, startDate }) => {
    const resolvedTheme = useResolvedTheme();
    const [option, setOption] = useState({});                   // echarts options

    const { data: accountData, error: accountError, isLoading: accountIsLoading } = useAccountData();

    // // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountHistoryData(
        {
            accountid: accountid,
            from: startDate,
            interpolate: false
        });

    useEffect(() => {

        if (data && !isLoading) {

            const { series, legend } = generateEChartSeries(data);

            setOption({
                // legend: {
                //     data: legend
                // },

                tooltip: {
                    trigger: 'axis',

                    formatter: function (params) {
                        let retStr = ""
                        let multiple = (params.length > 1) ? true : false
                        params.forEach((seriesItem, index) => {
                            const date = seriesItem.data[0]
                            const accountid = seriesItem.seriesName
                            const marker = seriesItem.marker
                            const val = seriesItem.data[1]
                            retStr += (index === 0) ? `${formatDate(date)}<br/>` : ""
                            retStr += (multiple) ?
                                `${marker}<b>${accountid}</b>: ${formatCurrency(val)}<br/>`
                                :
                                `${marker} ${formatCurrency(val)}<br/>`
                        })
                        return retStr
                    },


                    axisPointer: {
                        type: 'cross',
                        // label: {
                        //     backgroundColor: '#6a7985',
                        // },
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
                        boundaryGap: false,
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

                series: series

            });
        }
    }, [data,accountData]);


    function generateEChartSeries(data) {

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

        const legend = data.map(account => {
            return account.accountid;
        });

        const series = data.map((account, index) => {

            const color = colorPalette[index % colorPalette.length]; // Cycle through colors

            const account_shortname = (accountData && !accountIsLoading)
            ? accountData.find(acc => acc.accountid === account.accountid)?.shortname || account.accountid
            : account.accountid;

            return {
                name: `${account_shortname}`,
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
                data: account.series
            };
        });

        return { series, legend };
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
