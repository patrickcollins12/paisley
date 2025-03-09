import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { format } from "date-fns";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Link, useNavigate } from "@tanstack/react-router";
import GlobalFilter from "@/toolbar/GlobalFilter.jsx";
import useAccountData from "@/accounts/AccountApiHooks.js";
import { formatDate, formatCurrency, formatInterest } from "@/lib/localisation_utils.js";
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import AccountSparkLine from "@/accounts/AccountSparkLine.jsx";

import logos from '/src/logos/logos.json';


const AccountsPage = () => {
  const navigate = useNavigate({ from: "/accounts" });
  const { data, error, isLoading } = useAccountData();
  const [accounts, setAccounts] = useState([]);

  let logoObject = null;
  if (data) {
    logoObject = logos[data.institution]
  }


  const table = {};


  const isStale = (date) => (new Date() - new Date(date)) / (1000 * 60 * 60 * 24) > 8;

  useEffect(() => {
    if (data) {

      const activeAccounts = data.filter(acc => acc.status !== "inactive");

      // Create a lookup map for quick parent reference
      const accountMap = Object.fromEntries(activeAccounts.map(acc => [acc.accountid, { ...acc }]));

      // Step 1: Aggregate child account data into their respective parents
      activeAccounts.forEach(child => {
        if (child.parentid && accountMap[child.parentid]) {
          const parent = accountMap[child.parentid];

          // Sum balances
          parent.balance = (parent.balance || 0) + (child.balance || 0);

          // Track the latest balance_datetime
          if (!parent.balance_datetime || new Date(child.balance_datetime) > new Date(parent.balance_datetime)) {
            parent.balance_datetime = child.balance_datetime;
          }

        }
      });

      // Step 2: Remove child accounts (keep only top-level parents)
      const updatedAccounts = Object.values(accountMap).filter(acc => !acc.parentid);

      // Sort accounts by custom sortOrder
      // Custom sort order for account types
      const sortOrder = [
        "Checking",
        "Savings",
        "Crypto",
        "Investment",
        "Credit",
        "Mortgage",
      ];
      const sortedAccounts = updatedAccounts.sort((a, b) => {
        const indexA = sortOrder.indexOf(a.type);
        const indexB = sortOrder.indexOf(b.type);
        // Accounts with undefined types or not in sortOrder are pushed to the end
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
      });

      setAccounts(sortedAccounts);

    }
  }, [data]);


  // calculate total assets, liabilities and net worth
  const totalAssets = accounts
    .filter((acc) => acc.category === "asset")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalLiabilities = accounts
    .filter((acc) => acc.category === "liability")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const netWorth = totalAssets + totalLiabilities;

  return (
    <>
      {(isLoading || !data || (accounts && accounts.length === 0)) ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading accounts data</div>
      ) : (
        <>

          {/* <div className="flex flex-row mb-4">
            <div className="flex flex-row basis-1/2 space-x-2">
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link to="/rules/new">
                  <PlusIcon size={16} className="mr-1" />
                  Create Account
                </Link>
              </Button>
              <GlobalFilter dataTable={table} />
            </div>
          </div> */}


          <div className="flex flex-col items-center mb-4">
            <div className="overflow-auto inline-block">

              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-2">Account Name</TableHead>
                    <TableHead className="p-1">Account Type</TableHead>
                    <TableHead className="p-1 text-right">Balance</TableHead>
                    <TableHead className="p-1 hidden sm:table-cell">Last Balance</TableHead>
                    <TableHead className="p-1 hidden md:table-cell">1 year</TableHead>
                    <TableHead className="p-1 hidden md:table-cell text-right">Interest Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>

                  {/* Assets Section */}
                  <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                    <TableCell className="md:table-cell p-2 font-bold" colSpan="7">
                      What I own (Assets)
                    </TableCell>
                  </TableRow>
                  {accounts && accounts.filter((acc) => acc.category === "asset").map((account, index) => (
                    <TableRow
                      key={index}
                      className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
                      onClick={() => navigate({ to: `/account/${account.accountid}` })}
                    >
                      <TableCell className="p-1 font-medium hover:underline  ">
                        <div className="flex items-center gap-3">
                          {logos && logos[account.institution] && logos[account.institution]['location'] &&
                            <span className={`ml-3 p-1 border ${logos[account.institution]['background']} rounded-lg`}>
                              <img className="h-5" src={`${logos[account.institution]['location']}`} />
                            </span>}
                          <span>{account.shortname}</span>
                        </div>

                      </TableCell>
                      <TableCell className="p-1">{account.type}</TableCell>
                      <TableCell className="p-1 text-right">
                        {formatCurrency(account.balance, {currency: account.currency})}
                      </TableCell>
                      <TableCell className={`p-1 hidden sm:table-cell text-xxs opacity-50 ${isStale(account.balance_datetime) ? 'text-red-500' : ''}`}>
                        <DateTimeDisplay datetime={account.balance_datetime} options={{ delta: true, absolute: false }} />
                      </TableCell>
                      <TableCell className="p-0 hidden md:table-cell text-right">
                        {account && account.accountid &&
                          <AccountSparkLine accountid={account.accountid} />
                        }
                      </TableCell>
                      <TableCell className="p-1 hidden md:table-cell text-right">{formatInterest(account.interest)}</TableCell>
                    </TableRow>
                  ))}

                  {/* ✅ TOTAL ASSETS ROW */}
                  <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
                    <TableCell colSpan="2" className="p-2">Total (Assets)</TableCell>
                    <TableCell className="p-1 text-right">{formatCurrency(totalAssets, {currency:"AUD"})}</TableCell>
                    <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
                    <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>

                  </TableRow>



                  {/* Liabilities Section */}
                  <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                    <TableCell className="md:table-cell p-2 font-bold" colSpan="7">
                      What I owe (Liabilities)
                    </TableCell>
                  </TableRow>
                  {accounts && accounts.filter((acc) => acc.category === "liability").map((account, index) => (
                    <TableRow
                      key={index}
                      className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
                      onClick={() => navigate({ to: `/account/${account.accountid}` })}
                    >
                      <TableCell className="p-1 font-medium hover:underline whitespace-normal break-words">
                        <div className="flex items-center gap-3">
                          {logos && logos[account.institution] && logos[account.institution]['location'] &&
                            <span className={`ml-3 p-1 border ${logos[account.institution]['background']} rounded-lg`}>
                              <img className="h-5" src={`${logos[account.institution]['location']}`} />
                            </span>}
                          <span>{account.shortname}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-1">{account.type}</TableCell>
                      <TableCell className="p-1 text-right">
                        {formatCurrency(account.balance, {currency: account.currency})}
                      </TableCell>
                      <TableCell className={`p-1 hidden sm:table-cell text-xxs opacity-50 ${isStale(account.balance_datetime) ? 'text-red-500' : ''}`}>

                        <DateTimeDisplay datetime={account.balance_datetime} options={{ delta: true, absolute: false }} />
                      </TableCell>
                      <TableCell className="p-1 hidden md:table-cell text-right">
                        {account && account.accountid &&
                          <AccountSparkLine accountid={account.accountid} />
                        }
                      </TableCell>
                      <TableCell className="p-1 hidden md:table-cell text-right">{formatInterest(account.interest)}</TableCell>
                    </TableRow>
                  ))}


                  {/* ✅ TOTAL LIABILITIES ROW */}
                  <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
                    <TableCell colSpan="2" className="p-2">Total (Liabilities)</TableCell>
                    <TableCell className="p-1 text-right">{formatCurrency(totalLiabilities, {currency:"AUD"})}</TableCell>
                    <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
                    <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>
                  </TableRow>



                  {/* ✅ NET WORTH ROW */}
                  <TableRow className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 font-bold">
                    <TableCell colSpan="2" className="p-2">Net Worth</TableCell>
                    <TableCell className="p-1 text-right">{formatCurrency(netWorth, {currency:"AUD"})}</TableCell>
                    <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
                    <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>
                  </TableRow>

                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )
      }
    </>
  );
};

export default AccountsPage;
