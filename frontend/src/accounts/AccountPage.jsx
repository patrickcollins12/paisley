// react, routing, icons, shadn
import React, { useState, useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';

// main page components
import AccountBalanceChart from './AccountBalanceChart.jsx'
import AccountInterestTable from './AccountInterestTable.jsx'
import AccountVolumeChart from './AccountVolumeChart.jsx'
import ChartTimeSelection from "./ChartTimeSelection";
import AccountDetailsTable from './AccountDetailsTable.jsx'
import TransactionCard from "@/transactions/TransactionCard.jsx"
import { ScrollableSidebar } from "@/components/ScrollableSidebar.jsx"

//data loaders
import useAccountData from "@/accounts/AccountApiHooks.js";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx"

// utils
import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";

// what is the account id?
const routeApi = getRouteApi('/account/$accountId');

// load the logos, feel free to edit this and contribute
import logos from '/src/logos/logos.json';

// main component
const AccountPage = () => {

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountData(accountId);

    // dynamic graph start dates from the badge clicker called ChartTimeSelection
    const [startDate, setStartDate] = useState(null);

    // once the data is loaded, fetch the right insitutional logo, 
    // out of the logos object loaded earlier
    let logoObject = data ? logos[data.institution] : null

    // Fetch transactions `accountData?.shortname` is valid
    const { data: transactionData, error: transactionError, isLoading: transactionLoading } = useFetchTransactions(
        data?.shortname
            ? {
                pageIndex: 0,
                pageSize: 40,
                orderBy: { field: "datetime", dir: "desc" },
                "filters": [
                    {
                        "field": "account_shortname",
                        "operatorDefinition": { "operator": "in" },
                        "value": [data?.shortname]
                    }
                ],
            }
            : null // Pass null initially to avoid making a request
    );

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
                                        <div>{data && data.shortname}</div>
                                        <div className="text-xs opacity-50 font-normal mt-2">{accountId}</div>
                                    </span>
                                    {logoObject && logoObject.location &&
                                        <span className={`p-3 border ${logoObject.background || ''} rounded-lg`}>
                                            <img className="h-8" src={`${logoObject.location}`} />
                                        </span>}
                                </div>
                            </CardTitle>

                            {/* <CardDescription>
                                {accountId}
                            </CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <>
                                <div>
                                    {data && (data.balance !== null) &&
                                        <>
                                            <span className="text-4xl font-extrabold">{data && formatCurrency(data.balance)}</span>
                                            <span className="text-xl font-extrabold opacity-20">{data && data.currency}</span>
                                            <AccountBalanceChart accountid={data.accountid} category={data.category} startDate={startDate} />


                                        </>
                                    }
                                </div>

                                <div>
                                    {data &&
                                        <AccountVolumeChart accountId={data.accountid} startDate={startDate} />
                                    }
                                </div>

                                <div className="mt-2 mb-2">
                                    <ChartTimeSelection onStartDateChange={setStartDate} />
                                </div>

                            </>


                        </CardContent>
                    </Card>






                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                            {/* <CardDescription>Last updated: 25 Feb 2025</CardDescription> */}
                        </CardHeader>
                        <CardContent className="">
                            {data &&
                                <AccountDetailsTable data={data} />
                            }
                        </CardContent>
                    </Card>


                    {data && data.interest &&
                        <Card className="text-sm">
                            <CardHeader>
                                <CardTitle>
                                    Interest Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <>
                                    {data &&
                                        <AccountInterestTable accountId={data.accountid} category={data.category} startDate={startDate} />
                                    }
                                </>
                            </CardContent>
                        </Card>
                    }


                    <Card className="text-sm w-[450px]">
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            {data && data.balance_datetime &&
                                <div>
                                    <span className="text-xs mb-3">Last transaction: </span>
                                    <DateTimeDisplay datetime={data.balance_datetime} />
                                </div>
                            }

                            {/* <CardDescription>
                                transactions currently match this rule
                            </CardDescription> */}
                        </CardHeader>

                        <CardContent className="">
                            <ScrollableSidebar className=" flex flex-col gap-3 ">
                                {transactionData?.results.map(transaction => <TransactionCard key={transaction.id} data={transaction} />)}
                            </ScrollableSidebar>
                        </CardContent>
                    </Card>

                </div>
            </div>

        </>
    )
};

export default AccountPage;
