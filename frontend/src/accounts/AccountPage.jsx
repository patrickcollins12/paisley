import React, { useState, useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge"
const routeApi = getRouteApi('/account/$accountId');
import useAccountHistoryData from "@/accounts/AccountHistoryApiHooks.js";
import AccountBalanceChart from './AccountBalanceChart'
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


const AccountPage = () => {
    const { theme } = useTheme();

    const [option, setOption] = useState({});                   // echarts options
    const [startDate, setStartDate] = useState(null);           // dynamic graph start date

    const defaultPeriod = '3m';                                 // Default selected period
    const sd = calculateStartDate(defaultPeriod);        // Calculate start date based on the default period
    const [selectedPeriod, setSelectedPeriod] = useState(sd);

    useEffect(() => {
        setStartDate(sd);
        setSelectedPeriod(defaultPeriod);
    }, []);

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

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
            <div className="pb-4 text-sm text-muted-foreground">
                <Link to="/accounts">
                    <div className="flex items-center">
                        <ChevronLeft size={16} />
                        <div>Back</div>
                    </div>
                </Link>
            </div>

            <div className="container mx-auto p-4">
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>
                                <div className="flex col-2 items-center justify-between items-end gap-3">
                                    <span>
                                        <div>Bankwest Offset</div>
                                        <div className="text-xs opacity-50 font-normal">{accountId}</div>
                                    </span>
                                    <span className=""><img className="h-8" src="https://cdn.brandfetch.io/idIJhwG1L0/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B"></img></span>
                                </div>
                            </CardTitle>

                            {/* <CardDescription>
                                {accountId}
                            </CardDescription> */}
                        </CardHeader>
                        <CardContent>

                            <div>

                                <span className="text-4xl font-extrabold">$3,560.00</span>
                                <span className="text-xl font-extrabold opacity-20">AUD</span>
                                <div className="text-xs">Updated: Today 03:01am</div>
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
                                            <Badge variant={`${selectedPeriod === period ? 'default' : 'secondary'}`}>
                                                {period}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>


                            </div>
                            {/* 
                            <table className="table-fixed mt-10">
                                <tbody>
                                    <tr>
                                        <td className="font-bold pr-3">Institution</td>
                                        <td>Bankwest</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold pr-3">Account Name</td>
                                        <td>OFFSET TRANSACTION ACCOUNT</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold pr-3">Holders</td>
                                        <td>Patrick Collins and Danielle Collins</td>
                                    </tr>
                                </tbody>
                            </table> */}

                            <p className="pb-6"></p>

                        </CardContent>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Balance</CardTitle>
                            {/* <CardDescription>Last updated: 25 Feb 2025</CardDescription> */}
                        </CardHeader>
                        <CardContent className="">
                            <div className="mb-2">
                                {/* <Badge variant="secondary">5d</Badge>
                                <Badge variant="secondary">3m</Badge>
                                <Badge variant="secondary">6m</Badge>
                                <Badge variant="secondary">1y</Badge>
                                <Badge variant="secondary">2y</Badge>
                                <Badge variant="secondary">5y</Badge>
                                <Badge variant="secondary">All</Badge> */}

                                {periods.map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => handleBadgeClick(period)}
                                        className="mr-2 mb-2"
                                    >
                                        <Badge variant="secondary">{period}</Badge>
                                    </button>
                                ))}
                            </div>
                            {option && !isLoading && (
                                <ReactECharts
                                    option={option}
                                    style={{ width: "100%", height: "100%" }}
                                    lazyUpdate={true}
                                    theme={{ theme }}
                                />
                            )}

                        </CardContent>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 2</CardTitle>
                            <CardDescription>Description for card 2.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 2.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 2.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 3</CardTitle>
                            <CardDescription>Description for card 3.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 3.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 3.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 4</CardTitle>
                            <CardDescription>Description for card 4.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            This page needs a:
                            <ul>
                                <li>Nice summary card with balance</li>
                                <li>Editable fields</li>
                                <li>Balance trend</li>
                                <li>Interest trend</li>
                                <li>10 most recent transactions with a link to Transactions page</li>
                            </ul>

                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 4.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 5</CardTitle>
                            <CardDescription>Description for card 5.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 5.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 5.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 6</CardTitle>
                            <CardDescription>Description for card 6.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 6.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 6.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 7</CardTitle>
                            <CardDescription>Description for card 7.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 7.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 7.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 8</CardTitle>
                            <CardDescription>Description for card 8.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 8.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 8.</p>
                        </CardFooter>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Card Title 9</CardTitle>
                            <CardDescription>Description for card 9.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Content of card 9.</p>
                        </CardContent>
                        <CardFooter>
                            <p>Footer of card 9.</p>
                        </CardFooter>
                    </Card>
                </div>
            </div>

        </>
    )
};

export default AccountPage;
