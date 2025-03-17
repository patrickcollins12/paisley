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
                        params.reverse().forEach((seriesItem, index) => {
                            const date = seriesItem.data[0]
                            const accountid = seriesItem.seriesName
                            const marker = seriesItem.marker
                            const val = seriesItem.data[1]
                            const accountObj = accountData.find(acc => acc.accountid === accountid)
                            const shortname = accountObj?.shortname || accountid
                            const currency = accountObj?.currency || ""
                            const amount = formatCurrency(val, {currency: currency})
                            
                            retStr += (index === 0) ? `${formatDate(date)}<br/>` : ""
                            retStr += (multiple) ?
                                `${marker}<b>${shortname}</b>: ${amount}<br/>`
                                :
                                `${marker} ${amount}<br/>`
                        })
                        return retStr
                    },


                    axisPointer: {
                        show: false,
                        type: 'shadow',
                        shadowStyle: {
                            // color: '#222',
                            // type: "solid"
                        },
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
                        // if all is selected, the startDate will be null, so turn on the dataZoomer
                        show: startDate ? false : true,
                        realtime: true,
                        start: 25,
                        end: 100,
                        xAxisIndex: [0, 1]
                    },
                ],
                grid: {
                    left: '0%',
                    right: '0%',

                    // if all is selected, the startDate will be null, so leave space for the dataZoomer
                    bottom: startDate ? '14%' : '34%',

                    top: '0%',
                    containLabel: false
                },

                xAxis: [
                    {
                        show: true,
                        type: 'time',
                        onZero: true,
                        boundaryGap: false,
                        axisLine: {
                            show: false
                        },
                        axisLabel: {
                            show: true,
                            // margin: 3
                        }
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

                series: series // see generateEChartSeries below

            });
        }
    }, [data, accountData]);


    function generateEChartSeries(data) {

        const colorPalette = [
            "rgb(63, 182, 97)",   // Primary Green
            "rgb(50, 160, 90)",   // Slightly darker green
            "rgb(41, 138, 78)",   // Darker forest green
            "rgb(30, 115, 68)",   // Deep green
            "rgb(26, 188, 156)",  // Teal (bluer green)
            "rgb(39, 174, 228)",  // Soft blue
            "rgb(33, 140, 199)",  // Medium blue
            "rgb(24, 100, 160)",  // Deep blue
            "rgb(20, 80, 120)",   // Dark navy blue
            "rgb(80, 120, 100)"   // Muted desaturated green/blue (neutral-ish end)
        ];

        const legend = data.map(account => {
            return account.accountid;
        });

        const series = data.map((account, index) => {

            const color = colorPalette[index % colorPalette.length]; // Cycle through colors

            return {
                name: `${account.accountid}`,
                type: 'line',
                stack: 'Total',
                smooth: false,
                lineStyle: {
                    width: 2,
                    color: color
                },
                showSymbol: false,
                symbol: 'emptyCircle',
                symbolSize: 6,
                emphasis: {
                    focus: 'series'
                },

                itemStyle: {
                    color: color
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
