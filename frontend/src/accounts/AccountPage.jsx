import React, { useState, useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"
const routeApi = getRouteApi('/account/$accountId');
import AccountBalanceChart from './AccountBalanceChart.jsx'
import useAccountData from "@/accounts/AccountApiHooks.js";
import AccountDetailsTable from './AccountDetailsTable.jsx'
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx"
import { ScrollableSidebar } from "@/components/ScrollableSidebar.jsx"
import TransactionCard from "@/transactions/TransactionCard.jsx"
import { use } from "react";

function addCommas(number) {
    return number?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const AccountPage = () => {

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountData(accountId);

    const { data: accountData, error: accountError, isLoading: accountLoading } = useAccountData(accountId);

    // Fetch transactions only when `accountData?.shortname` is available
    const { data: transactionData, error: transactionError, isLoading: transactionLoading } = useFetchTransactions(
        accountData?.shortname
            ? {
                pageIndex: 0,
                pageSize: 40,
                orderBy: { field: "datetime", dir: "desc" },
                "filters": [
                    {
                        "field": "account_shortname",
                        "operatorDefinition": {
                            "id": "lookup_is",
                            "label": "is",
                            "operator": "in",
                            "short": ""
                        },
                        "value": [
                            accountData?.shortname
                        ]
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
                                <span className="text-4xl font-extrabold">${data && addCommas(data.balance)}</span>
                                <span className="text-xl font-extrabold opacity-20">{data && data.currency}</span>
                                <div className="text-xs">Updated: {data && data.balance_datetime}</div>

                                <AccountBalanceChart accountId={data && data.accountid} />
                            </div>


                        </CardContent>
                    </Card>
                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                            {/* <CardDescription>Last updated: 25 Feb 2025</CardDescription> */}
                        </CardHeader>
                        <CardContent className="">
                            <AccountDetailsTable data={data} />
                        </CardContent>
                    </Card>


                    <Card className="text-sm w-[450px]">
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
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
                    {/* 
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
                     */}

                </div>
            </div>

        </>
    )
};

export default AccountPage;
