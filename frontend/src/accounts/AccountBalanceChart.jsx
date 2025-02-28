import React, { useState, useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge"
const routeApi = getRouteApi('/account/$accountId');
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
// import useAccountData from "@/accounts/AccountApiHooks.js";

// Function to calculate the start date based on the selected period
const calculateStartDate = (period) => {
    const today = new Date();
    let newStartDate;

    switch (period) {
        case '5d':
            newStartDate = new Date(today.setDate(today.getDate() - 5));
            break;
        case '1m':
            newStartDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
        case '3m':
            newStartDate = new Date(today.setMonth(today.getMonth() - 3));
            break;
        case '1y':
            newStartDate = new Date(today.setFullYear(today.getFullYear() - 1));
            break;
        case '2y':
            newStartDate = new Date(today.setFullYear(today.getFullYear() - 2));
            break;
        case 'All':
            newStartDate = null; // Or set to the earliest date available
            break;
        default:
            newStartDate = null;
    }

    return newStartDate ? newStartDate.toISOString().split('T')[0] : null; // Format to 'YYYY-MM-DD'
};


const AccountBalanceChart = ({ accountId }) => {
    const { theme } = useTheme();

    const [option, setOption] = useState({});                   // echarts options
    const defaultPeriod = '3m';                                 // Default selected period
    const sd = calculateStartDate(defaultPeriod);        // Calculate start date based on the default period
    const [startDate, setStartDate] = useState(null);           // dynamic graph start date
    const [selectedPeriod, setSelectedPeriod] = useState(sd);

    useEffect(() => {
        setStartDate(sd);
        setSelectedPeriod(defaultPeriod);
    }, []);

    // grab the path parameter from the URL
    // const { accountId } = routeApi.useParams();

    // const { data, error, isLoading } = useAccountHistoryData(accountId, "2022-12-01");
    // // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountHistoryData(accountId, startDate);
    // const { accountData, accountError, accountIsLoading } = useAccountData(accountId);

    // TODO: make this work in local currencies.
    function formatCurrency(value) {
        return '$' + echarts.format.addCommas(value.toFixed(2))
    }

    // Array of period labels
    const periods = ['5d', '1m', '3m', '1y', '2y', 'All'];

    // Handle badge click
    const handleBadgeClick = (period) => {
        setSelectedPeriod(period);
        const calculatedStartDate = calculateStartDate(period);
        setStartDate(calculatedStartDate);
    };

    useEffect(() => {
        if (data && !isLoading) {

            const balances = data.balances
            const dates = data.dates

            setOption({
                tooltip: {
                    trigger: 'axis',
                    // formatter: '{b0}<br>${c0}',
                    formatter: function (params) {
                        const name = params[0].name
                        const data = params[0].data
                        return `${name}<br><b>${formatCurrency(data)}</b>`
                    },
                    axisPointer: {
                        type: 'line',
                        label: {
                            backgroundColor: '#6a7985',
                        },

                    }
                },
                // legend: {
                //     data: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']
                // },
                // toolbox: {
                //     feature: {
                //         saveAsImage: {}
                //     }      
                // },
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
                        type: 'category',
                        boundaryGap: false,
                        data: dates
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        show: false,
                        // min: "dataMin",
                        min: function (value) {
                            const val = value.min - ((value.max - value.min) * 0.4)
                            // value.calcmin = val
                            // console.log(value)
                            return val
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
                                    offset: 0,
                                    color: 'rgb(128, 255, 165)'
                                },
                                // {
                                //     offset: .8,
                                //     color: 'rgba(128, 255, 164, 0.5)'
                                // },
                                {
                                    offset: 1,
                                    color: 'rgb(128, 255, 165, 0)'
                                }
                            ])
                        },
                        // emphasis: {
                        //     focus: 'series'
                        // },
                        data: balances
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

            <div className="mb-2">
                {periods.map((period) => (
                    <button
                        key={period}
                        onClick={() => handleBadgeClick(period)}
                        className="mr-2"
                    >
                        <Badge variant={selectedPeriod === period ? "default" : "secondary"}>
                            {period}
                        </Badge>
                    </button>
                ))}
            </div>
        </>
    )
};

export default AccountBalanceChart;
