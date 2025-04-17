// react, routing, icons, shadn
import React, { useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
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
import { BackNav } from "@/components/BackNav.jsx"
import AccountIcon from '../icons/AccountIcon.jsx';

//data loaders
import useAccountData from "@/accounts/AccountApiHooks.js";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx"

// utils
// import { formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";
import { useTranslation } from 'react-i18next';

// main component
const AccountPage = () => {
    const { t, i18n } = useTranslation();

    // what is the account id?
    const routeApi = getRouteApi('/account/$accountId');

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    // Fetch all accounts data using the custom hook
    const { data, error, isLoading } = useAccountData(accountId);

    // dynamic graph start dates from the badge clicker called ChartTimeSelection
    const [startDate, setStartDate] = useState(null);

    // Filter the array to find the actual account with the matching accountId
    const account = data || null;

    // Find child accounts using the children property from the found account object
    const childAccounts = account?.children || [];

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

            <BackNav />

            <div className="container mx-auto p-0">
                {/* <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Main content — grows naturally */}
                    <div className="w-full md:basis-1/2 lg:basis-2/3 md:flex-1 flex flex-col gap-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="text-sm">
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex col-2 items-center justify-between items-end gap-3">
                                            <span>
                                                <div>{account && account.shortname}</div>

                                                <div className="text-xs opacity-50 font-normal mt-2">{accountId}</div>

                                                {account &&
                                                    account.status === "inactive" &&
                                                    <div className="text-xs opacity-50 font-normal mt-2 text-red-500">
                                                        (this account is marked as inactive)
                                                    </div>
                                                }

                                            </span>
                                            {account && (
                                                <AccountIcon
                                                    institution={account.institution}
                                                    type={account.type}
                                                    className="p-3"
                                                    logoClassName="h-8"
                                                    iconSize={32}
                                                />
                                            )}
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
                                                        {account && formatCurrency(account.balance, { currency: account.currency, })}
                                                    </span>
                                                    <span className="text-xl font-extrabold opacity-20">{account && account.currency}</span>

                                                    <div className="w-full min-w-[100px] min-h-[200px] h-[25vh] max-h-[600px]" >
                                                        <AccountBalanceChart
                                                            key={account.accountid}  // Force re-render by changing the key whenever accountId changes
                                                            accountid={account.accountid}
                                                            category={account.category}
                                                            startDate={startDate} />
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


                            {account &&
                                <AccountDetailsTable data={account} />
                            }



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
                        </div>
                    </div>

                    <div className="w-full md:basis-1/2 lg:basis-1/3 md:flex-1 flex flex-col gap-4">
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
            </div>

        </>
    )
};

export default AccountPage;
