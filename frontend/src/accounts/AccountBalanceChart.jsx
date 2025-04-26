import React, { useState, useEffect, useRef } from "react";
// import ReactECharts from "echarts-for-react";
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';

import { LineChart } from 'echarts/charts';
import {
    TooltipComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent // Added in case legend options are used
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { DateTime } from "luxon";
// Register necessary components
echarts.use([
    TooltipComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer
]);

import { useResolvedTheme } from "@/components/theme-provider";
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
import useAccountData from "@/accounts/AccountApiHooks.js";

import { formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";


const AccountBalanceChart = ({ accountid, category, startDate, onHoverBalanceChange, onMouseOut }) => {
    const resolvedTheme = useResolvedTheme();
    const [option, setOption] = useState({});                   // echarts options
    const chartRef = useRef(null);

    const { data: accountData, error: accountError, isLoading: accountIsLoading } = useAccountData(accountid);

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
                    show: true,
                    showContent: true,
                    // axisPointer: { type: 'line' },

                    axisPointer: {
                        show: true,
                        type: 'line',
                        z: 1,
                        lineStyle: {
                            // color: '#222',
                            opacity: 0.2,
                            type: "solid",

                        },
                        label: {
                            show: false,
                            backgroundColor: '#6a7985',
                        },
                    },

                    confine: true,
                    padding: [0, 5],
                    transitionDuration: 0,
                    position: function (point, params, dom, rect, size) {
                        // fixed at top
                        const w = size.contentSize[0]
                        const x = point[0]
                        return [x - w / 2, '0%'];
                    },
                    formatter: function (params) {
                        const date = params[0]?.axisValue || '';
                        // turn epoch date into a human readable date using luxon
                        // format as dd/Mon/yyyy
                        const humanReadableDate = DateTime.fromMillis(date).toFormat("dd MMM yyyy")
                        return `${humanReadableDate}`
                    },

                    // This is the old formatter that had each series on the tooltip
                    // formatter: function (params) {
                    //     let retStr = ""
                    //     let multiple = (params.length > 1) ? true : false
                    //     params.reverse().forEach((seriesItem, index) => {
                    //         const date = seriesItem.data[0]
                    //         const accountid = seriesItem.seriesName
                    //         const marker = seriesItem.marker
                    //         const val = seriesItem.data[1]
                    //         const shortname = accountData?.shortname || accountid
                    //         const currency = accountData?.currency || ""
                    //         const amount = formatCurrency(val, { currency: currency })

                    //         retStr += (index === 0) ? `${formatDate(date)}<br/>` : ""
                    //         retStr += (multiple) ?
                    //             `${marker}<b>${shortname}</b>: ${amount}<br/>`
                    //             :
                    //             `${marker} ${amount}<br/>`
                    //     })
                    //     // return retStr
                    //     return ""
                    // },


                },

                xAxis: [
                    {
                        type: 'time',
                        onZero: true,
                        tooltip: {
                            show: true,
                            position: function (point, params, dom, rect, size) {
                                // fixed at top
                                return [point[0], '100%'];
                            }
                        },
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
                        tooltip: {
                            show: true
                        },
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
                        start: 0,
                        end: 100,
                        xAxisIndex: [0, 1]
                    },
                ],
                grid: {
                    left: '0%',
                    right: '0%',

                    // if all is selected, the startDate will be null, so leave space for the dataZoomer
                    bottom: startDate ? '14%' : '34%',

                    top: '15%',
                    containLabel: false
                },


                series: series // see generateEChartSeries below

            });
        }
    }, [data, accountData, isLoading, category, startDate, resolvedTheme]);

    // Effect to attach/detach ECharts event listeners
    useEffect(() => {
        const chartInstance = chartRef.current?.getEchartsInstance();
        if (!chartInstance) return;

        const handleShowTip = (params) => {
            // params contains info about the tooltip trigger
            // We need the data point associated with it.
            // ECharts often provides the relevant data points in params.dataIndex or implicitly via series data
            // Let's try accessing it via the first series' data point corresponding to the tooltip
            if (onHoverBalanceChange &&
                params.dataIndex !== undefined &&
                option?.series?.[0]?.data?.[params.dataIndex]
            ) {
                const dateIndex = params.dataIndex
                const hoveredDate = data[0].series[dateIndex][0][0]
                const vals = data.map(acct => acct.series[dateIndex][1])
                const hoveredValue = vals.reduce((sum, a) => sum + (a || 0.0) );
                onHoverBalanceChange(hoveredValue, hoveredDate);

                // const hoveredDate = dataPoint[0];

                // const dataPoint = option.series[0].data[dateIndex];
                // if (dataPoint && dataPoint.length >= 2) {
                //     const hoveredValue = dataPoint[1];
                //     const hoveredDate = dataPoint[0];
                //     onHoverBalanceChange(hoveredValue, hoveredDate);
                // }
            }
        };

        const handleHideTip = () => {
            if (onMouseOut) {
                onMouseOut();
            }
        };

        chartInstance.on('showTip', handleShowTip);
        chartInstance.on('hideTip', handleHideTip);

        // Cleanup function
        return () => {
            chartInstance.off('showTip', handleShowTip);
            chartInstance.off('hideTip', handleHideTip);
        };

    }, [option, onHoverBalanceChange, onMouseOut]);


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
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
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
            {/* Ensure option is not empty before rendering to avoid errors */}
            {option && Object.keys(option).length > 0 && (
                <ReactEChartsCore
                    ref={chartRef}
                    echarts={echarts}
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
