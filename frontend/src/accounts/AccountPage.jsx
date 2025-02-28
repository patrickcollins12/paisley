import React, { useState, useEffect } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"
const routeApi = getRouteApi('/account/$accountId');
import AccountBalanceChart from './AccountBalanceChart.jsx'
// import useAccountData from "@/accounts/AccountApiHooks.js";

const AccountPage = () => {

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountData(accountId);

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

                                <AccountBalanceChart accountId={accountId} />

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
                            </div>
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
