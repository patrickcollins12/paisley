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
// import { formatDate } from "@/lib/localisation_utils.js";
import { Currency, formatCurrency } from "@/components/CurrencyDisplay.jsx";
import { useTranslation } from 'react-i18next';

// what is the account id?
const routeApi = getRouteApi('/account/$accountId');

// load the logos, feel free to edit this and contribute
import logos from '/src/logos/logos.json';

// main component
const AccountPage = () => {
    const { t, i18n } = useTranslation();

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    // Fetch all accounts data using the custom hook
    const { data, error, isLoading } = useAccountData();

    // dynamic graph start dates from the badge clicker called ChartTimeSelection
    const [startDate, setStartDate] = useState(null);

    // Filter the array to find the actual account with the matching accountId
    const account = data?.find(acc => acc.accountid === accountId) || null;

    // Find child accounts where the accountId is the parent account
    const childAccounts = data?.filter(acc => acc.parentid === accountId) || [];

    // If account.balance is null or zero, then sum up the child accounts balances
    if (account && (!account.balance || account.balance === 0)) {
        account.balance = childAccounts.reduce((acc, child) => acc + child.balance, 0);
    }

    // Once the data is loaded, fetch the right institutional logo
    let logoObject = account ? logos[account.institution] : null;

    // Fetch transactions `accountData?.shortname` is valid
    const { data: transactionData, error: transactionError, isLoading: transactionLoading } = useFetchTransactions(
        account?.shortname
            ? {
                pageIndex: 0,
                pageSize: 40,
                orderBy: { field: "datetime", dir: "desc" },
                "filters": [
                    {
                        "field": "account_shortname",
                        "operatorDefinition": { "operator": "in" },
                        "value": [account?.shortname]
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
                        <div>{t('Back')}</div>
                    </div>
                </Link>
            </div>

            <div className="container mx-auto p-0">
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>
                                <div className="flex col-2 items-center justify-between items-end gap-3">
                                    <span>
                                        <div>{account && account.shortname}</div>
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
                                    {account &&
                                        <>
                                            <span className="text-4xl font-extrabold">
                                                {account && formatCurrency(account.balance, { style: "decimal", currency: account.currency, })}
                                            </span>
                                            <span className="text-xl font-extrabold opacity-20">{account && account.currency}</span>

                                            <div className="w-full min-w-[100px] min-h-[200px] h-[25vh] max-h-[600px]" >
                                                <AccountBalanceChart accountid={account.accountid} category={account.category} startDate={startDate} />
                                            </div>

                                        </>
                                    }
                                </div>

                                <div>
                                    {account &&
                                        <AccountVolumeChart accountId={account.accountid} startDate={startDate} />
                                    }
                                </div>

                                <div className="mt-2 mb-2">
                                    <ChartTimeSelection onStartDateChange={setStartDate} />
                                </div>

                            </>


                        </CardContent>
                    </Card>


                    {/* Sub accounts! */}
                    {childAccounts.length > 0 && (
                        <Card className="text-sm">
                            <CardHeader>
                                <CardTitle>{t("Sub Accounts")}</CardTitle>
                            </CardHeader>
                            <CardContent className="">
                                <table className="table-fixed border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="text-left px-4 py-2">{t("Account Name")}</th>
                                            <th className="text-left px-4 py-2 text-right">{t("Balance")}</th>
                                            <th className="text-left px-4 py-2">{t("Last updated")}</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {childAccounts.map((child) => (
                                            <tr key={child.accountid}>
                                                <td className="px-4 py-2">
                                                    <Link to={`/account/${child.accountid}`} className="text-blue-600 hover:underline">
                                                        {child.shortname}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(child.balance, { currency: child.currency })}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <DateTimeDisplay datetime={child.balance_datetime} options={{ delta: true, absolute: false }} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}


                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>{t("Details")}</CardTitle>
                            {/* <CardDescription>Last updated: 25 Feb 2025</CardDescription> */}
                        </CardHeader>
                        <CardContent className="">
                            {account &&
                                <AccountDetailsTable data={account} />
                            }
                        </CardContent>
                    </Card>



                    {account && account.interest &&
                        <Card className="text-sm">
                            <CardHeader>
                                <CardTitle>
                                    {t("Interest Rate")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <>
                                    {account &&
                                        <AccountInterestTable accountId={account.accountid} category={account.category} startDate={startDate} />
                                    }
                                </>
                            </CardContent>
                        </Card>
                    }


                    <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>{t("Recent Transactions")}</CardTitle>
                        </CardHeader>

                        <CardContent className="">

                            <div className="text-xs mb-3">
                                {(account && account.balance_datetime) ?
                                    <>
                                        <span className="text-xs mb-3">{t("Last transaction")}: </span>
                                        <DateTimeDisplay datetime={account.balance_datetime} />
                                    </>
                                    :
                                    <span>{t("No transactions found")}</span>
                                }
                            </div>

                            <ScrollableSidebar className="flex flex-col gap-2">
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
