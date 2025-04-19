import React, { useState, useEffect } from "react";
import { getRouteApi } from "@tanstack/react-router"
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';


import { BarChart } from 'echarts/charts';
import {
    TooltipComponent,
    DataZoomComponent,
    GridComponent
} from 'echarts/components';

import {
    CanvasRenderer
} from 'echarts/renderers';

import { useResolvedTheme } from "@/components/theme-provider";
import useAccountTransactionVolume from "@/accounts/AccountTransactionVolumeApiHooks.js";

// Register necessary components
echarts.use([
    TooltipComponent,
    DataZoomComponent,
    GridComponent,
    BarChart,
    CanvasRenderer
]);

const AccountVolumeChart = ({ accountId, startDate }) => {
    const theme = useResolvedTheme();
    const [option, setOption] = useState({});                   // echarts options
    const { data, error, isLoading } = useAccountTransactionVolume(accountId, startDate);

    // echarts options
    useEffect(() => {
        if (data && !isLoading) {

            // const updatedData = updateBalances(data);
            // const balances = updatedData.balances
            // const dates = updatedData.dates

            setOption({
                tooltip: {
                    trigger: 'axis',
                    // formatter: '{a0}<br/>${b0}<br/>${c0}<br/>${d0}',
                    formatter: function (params) {
                        const key = params[0]?.data[0]
                        const val = Math.abs(params[0]?.data[1])
                        return `${key}<br><b>transactions: ${val}</b>`
                    },
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
                        boundaryGap: false,
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        show: false,
                    }
                ],
                series: [
                    {
                        type: 'bar',
                        itemStyle: {
                            color: 'rgb(120, 219, 135)',
                            opacity: 0.5
                        },
                        data: data.map(item => [item.date, -item.transaction_count])
                    }

                ]
            });
        }
    }, [data]);

    // main jsx
    return (
        <>{!error && data && data.length > 0 && option && (
            <>
                <div style={{ height: `30px` }}>
                    <ReactEChartsCore
                        echarts={echarts} // Pass echarts instance
                        option={option}
                        style={{ width: "100%", height: "100%" }}
                        lazyUpdate={true}
                        theme={{ theme }}
                    />
                </div>
            </>
        )}
        </>
    )
};

export default AccountVolumeChart;
