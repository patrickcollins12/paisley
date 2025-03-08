import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Link, useNavigate } from "@tanstack/react-router";
import GlobalFilter from "@/toolbar/GlobalFilter.jsx";
import useAccountData from "@/accounts/AccountApiHooks.js";

import logos from '/src/logos/logos.json';


const AccountsPage = () => {
  const navigate = useNavigate({ from: "/accounts" });
  const { data, error, isLoading } = useAccountData();
  const [accounts, setAccounts] = useState([]);

  let logoObject = null;
  if (data) {
    logoObject = logos[data.institution]
    console.log("here is the logo object", logoObject)
  }


  const table = {};

  // Function to format currency properly
  const formatCurrency = (amount, currency) => {
    if (!amount) return "";

    // console.log(`amount: ${amount}, currency: ${currency}`);
    const formattedAmount = amount
      .toLocaleString("en-AU", { style: "currency", currency: "AUD" })
      .replace("A$", "$");
    return currency === "USD" ? `${formattedAmount} USD` : formattedAmount;
  };

  const isStale = (date) => (new Date() - new Date(date)) / (1000 * 60 * 60 * 24) > 30;

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

          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="p-4">Account Name</TableHead>
                <TableHead className="p-4">Account Type</TableHead>
                <TableHead className="p-4 text-right">Balance</TableHead>
                <TableHead className="p-4 hidden sm:table-cell">Last Updated</TableHead>
                <TableHead className="p-4 hidden md:table-cell text-right">Trend</TableHead>
                <TableHead className="p-4 hidden md:table-cell text-right">Interest Rate</TableHead>
                <TableHead className="p-4 hidden md:table-cell text-right">Interest YoY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Assets Section */}
              <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                <TableCell className="md:table-cell p-4 font-bold" colSpan="7">
                  What I own (Assets)
                </TableCell>
              </TableRow>
              {accounts && accounts.filter((acc) => acc.category === "asset").map((account, index) => (
                <TableRow
                  key={index}
                  className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
                  onClick={() => navigate({ to: `/account/${account.accountid}` })}
                >
                  <TableCell className="p-4 font-medium hover:underline  ">
                    <div className="flex items-center gap-3">
                      {logos && logos[account.institution] && logos[account.institution]['location'] &&
                        <span className={`ml-3 p-1 border ${logos[account.institution]['background']} rounded-lg`}>
                          <img className="h-5" src={`${logos[account.institution]['location']}`} />
                        </span>}
                      <span>{account.shortname}</span>

                    </div>

                  </TableCell>
                  <TableCell className="p-4">{account.type}</TableCell>
                  <TableCell className="p-4 text-right">
                    {formatCurrency(account.balance, account.currency)}
                  </TableCell>
                  <TableCell className="p-4 hidden sm:table-cell">
                    {format(new Date(account.balance_datetime), "MMM dd, yyyy")} {isStale(account.balance_datetime) && "(stale)"}
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                </TableRow>
              ))}

              {/* ✅ TOTAL ASSETS ROW */}
              <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
                <TableCell colSpan="2" className="p-4">Total (Assets)</TableCell>
                <TableCell className="p-4 text-right">{formatCurrency(totalAssets, "AUD")}</TableCell>
                <TableCell colSpan="1" className="p-4 font-bold hidden sm:table-cell"></TableCell>
                <TableCell colSpan="4" className="p-4 font-bold hidden md:table-cell"></TableCell>
              </TableRow>



              {/* Liabilities Section */}
              <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
                <TableCell className="md:table-cell p-4 font-bold" colSpan="7">
                  What I owe (Liabilities)
                </TableCell>
              </TableRow>
              {accounts && accounts.filter((acc) => acc.category === "liability").map((account, index) => (
                <TableRow
                  key={index}
                  className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
                  onClick={() => navigate({ to: `/account/${account.accountid}` })}
                >
                  <TableCell className="p-4 font-medium hover:underline whitespace-normal break-words">
                    {account.shortname}
                  </TableCell>
                  <TableCell className="p-4">{account.type}</TableCell>
                  <TableCell className="p-4 text-right">
                    {formatCurrency(account.balance, account.currency)}
                  </TableCell>
                  <TableCell className="p-4 hidden sm:table-cell">
                    {format(new Date(account.balance_datetime), "MMM dd, yyyy")} {isStale(account.balance_datetime) && "(stale)"}
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                  <TableCell className="p-4 hidden md:table-cell text-right">n/a</TableCell>
                </TableRow>
              ))}


              {/* ✅ TOTAL LIABILITIES ROW */}
              <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
                <TableCell colSpan="2" className="p-4">Total (Liabilities)</TableCell>
                <TableCell className="p-4 text-right">{formatCurrency(totalLiabilities, "AUD")} AUD</TableCell>
                <TableCell colSpan="1" className="p-4 font-bold hidden sm:table-cell"></TableCell>
                <TableCell colSpan="4" className="p-4 font-bold hidden md:table-cell"></TableCell>
              </TableRow>



              {/* ✅ NET WORTH ROW */}
              <TableRow className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 font-bold">
                <TableCell colSpan="2" className="p-4">Net Worth</TableCell>
                <TableCell className="p-4 text-right">{formatCurrency(netWorth, "AUD")} AUD</TableCell>
                <TableCell colSpan="1" className="p-4 font-bold hidden sm:table-cell"></TableCell>
                <TableCell colSpan="4" className="p-4 font-bold hidden md:table-cell"></TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </>
      )}
    </>
  );
};

export default AccountsPage;
