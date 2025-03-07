import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useTheme } from "@/components/theme-provider";
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";

import { formatCurrency } from "@/lib/localisation_utils.js";

const AccountBalanceChart = ({ accountId, category, startDate }) => {
    const { theme } = useTheme();
    const [option, setOption] = useState({});                   // echarts options

    // // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountHistoryData(accountId, startDate);

    useEffect(() => {
        if (data && !isLoading) {

            // const updatedData = updateBalances(data);
            // const balances = updatedData.balances
            // const dates = updatedData.dates

            setOption({
                tooltip: {
                    trigger: 'axis',
                    // formatter: '{b0}<br>${c0}',
                    formatter: function (params) {
                        const key = params[0]?.data[0]
                        const val = params[0]?.data[1]
                        return `${key}<br><b>Balance: ${formatCurrency(val)}</b>`
                    },
                    // formatter: function (params) {
                    //     const key = params[0]?.data[0]
                    //     const val = Math.abs(params[0]?.data[1])
                    //     return `${key}<br><b>transactions: ${val}</b>`
                    // },
                    axisPointer: {
                        type: 'line',
                        label: {
                            backgroundColor: '#6a7985',
                        },

                    }
                },

                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
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

                series: [
                    {
                        // name: 'Bankwest Offset Balance',
                        type: 'line',
                        // stack: 'Total',
                        smooth: false,
                        lineStyle: {
                            width: 2,
                            color: 'rgb(63, 182, 97)'

                        },
                        showSymbol: false,
                        areaStyle: {
                            opacity: 0.9,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                {
                                    offset: category === "liability" ? 1 : 0,
                                    color: 'rgb(128, 255, 165)'
                                },
                                // {
                                //     offset: .8,
                                //     color: 'rgba(128, 255, 164, 0.5)'
                                // },
                                {
                                    offset: category === "liability" ? 0 : 1,
                                    color: 'rgb(128, 255, 165, 0)'
                                }
                            ])
                        },
                        // emphasis: {
                        //     focus: 'series'
                        // },
                        // data: data.map(item => item.datetime)
                        data: data.map(item => [item.datetime, item.balance])
                    }
                ]

            });
        }
    }, [data]);

    return (
        <>
            {option && (
                <ReactECharts
                    option={option}
                    style={{ width: "100%", height: "100%" }}
                    lazyUpdate={true}
                    theme={{ theme }}
                />
            )}

            
        </>
    )
};

export default AccountBalanceChart;
