import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns"; // For formatting dates

import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import { Link, useNavigate } from "@tanstack/react-router"
import GlobalFilter from "@/toolbar/GlobalFilter.jsx"


const AccountsPage = () => {
  const today = new Date();

  const navigate = useNavigate({ from: '/accounts' })

  const table = {}

  const accounts = [
    { accountid: "bankwestid", asset_liability: "asset", name: "Bankwest Offset", accountType: "Savings", balance: 12946, currency: "AUD", lastUpdated: new Date(), trend: "+3.2%", interestRate: "4.2%", interestYoY: "-0.1%" },
    { asset_liability: "asset", name: "Westpac Choice", accountType: "Savings", balance: 3697, currency: "AUD", lastUpdated: new Date(), trend: "-1.1%", interestRate: "0.5%", interestYoY: "+0.2%" },
    { asset_liability: "asset", name: "Robinhood Brokerage", accountType: "Investment", balance: 5000, currency: "USD", lastUpdated: new Date(today.setDate(today.getDate() - 2)), trend: "+1.5%", interestRate: "0%", interestYoY: "+0.3%" },
    { asset_liability: "liability", name: "Mortgage (Bankwest)", accountType: "Mortgage", balance: -200000, currency: "AUD", lastUpdated: new Date(), trend: "-", interestRate: "3.5%", interestYoY: "+0.1%" },
    { asset_liability: "liability", name: "Credit Card Debt", accountType: "Credit", balance: -4550, currency: "AUD", lastUpdated: new Date(today.setDate(today.getDate() - 5)), trend: "-2.0%", interestRate: "18.9%", interestYoY: "-0.5%" },
    { asset_liability: "asset", name: "PayPal USD", accountType: "Cash", balance: 1200, currency: "USD", lastUpdated: new Date(today.setDate(today.getDate() - 1)), trend: "+0.8%", interestRate: "0%", interestYoY: "+0.1%" },
  ];

  // Function to format currency properly
  const formatCurrency = (amount, currency) => {
    const formattedAmount = amount.toLocaleString("en-AU", { style: "currency", currency: "AUD" }).replace("A$", "$");
    return currency === "USD" ? `${formattedAmount} USD` : formattedAmount;
  };

  const totalAssets = accounts
    .filter(acc => acc.asset_liability === "asset")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalLiabilities = accounts
    .filter(acc => acc.asset_liability === "liability")
    .reduce((sum, acc) => sum + acc.balance, 0);

  const netWorth = totalAssets + totalLiabilities;

  const isStale = (date) => (new Date() - date) / (1000 * 60 * 60 * 24) > 3;

  return (
    <>
      {/* <div className="overflow-x-auto w-full">
    <div className="flex flex-row basis-1/2 space-x-2 mb-4"> */}
      <div className="flex flex-row mb-4">
        <div className="flex flex-row basis-1/2 space-x-2">

          <Button variant='outline' size='sm' className='h-8' asChild>
            <Link to="/rules/new">
              <PlusIcon size={16} className='mr-1' />
              Create Account
            </Link>
          </Button>

          <GlobalFilter dataTable={table} />
        </div>
      </div>

      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="p-4">Account Name</TableHead>
            <TableHead className="p-4 ">Account Type</TableHead>
            <TableHead className="p-4 text-right">Balance</TableHead>
            <TableHead className="p-4 hidden sm:table-cell">Last Updated</TableHead>
            <TableHead className="p-4 hidden md:table-cell text-right">Trend</TableHead>
            <TableHead className="p-4 hidden md:table-cell text-right">Interest Rate</TableHead>
            <TableHead className="p-4 hidden md:table-cell text-right">Interest YoY</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* ✅ ASSETS SECTION */}
          <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
            <TableCell className="md:table-cell p-4 font-bold" colSpan="7">
              What I own (Assets)
            </TableCell>
          </TableRow>
          {accounts.filter(acc => acc.asset_liability === "asset").map((account, index) => (
            <TableRow key={index} className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
              onClick={() => navigate({ 'to': `/account/${account.accountid}` })}
            >
              <TableCell className="p-4 font-medium hover:underline whitespace-normal break-words">{account.name}</TableCell>
              <TableCell className="p-4">{account.accountType}</TableCell>
              <TableCell className="p-4 text-right">{formatCurrency(account.balance, account.currency)}</TableCell>
              <TableCell className="p-4 hidden sm:table-cell">
                {format(account.lastUpdated, "MMM dd, yyyy")}
                {isStale(account.lastUpdated) && " (stale)"}
              </TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.trend}</TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.interestRate}</TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.interestYoY}</TableCell>
            </TableRow>
          ))}
          {/* ✅ TOTAL ASSETS ROW */}
          <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
            <TableCell colSpan="2" className="p-4">Total (Assets)</TableCell>
            <TableCell className="p-4 text-right">{formatCurrency(totalAssets, "AUD")}</TableCell>
            <TableCell colSpan="1" className="p-4 font-bold hidden sm:table-cell"></TableCell>
            <TableCell colSpan="4" className="p-4 font-bold hidden md:table-cell"></TableCell>
          </TableRow>


          {/* ✅ LIABILITIES SECTION */}
          <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
            <TableCell className="md:table-cell p-4 font-bold" colSpan="7">
              What I owe (Liabilities)
            </TableCell>
          </TableRow>
          {accounts.filter(acc => acc.asset_liability === "liability").map((account, index) => (
            <TableRow key={index} className="border-t bg-opacity-90 transition duration-150 cursor-pointer">
              <TableCell className="p-4 font-medium hover:underline whitespace-normal break-words">{account.name}</TableCell>
              <TableCell className="p-4">{account.accountType}</TableCell>
              <TableCell className="p-4 text-right">{formatCurrency(account.balance, account.currency)}</TableCell>
              <TableCell className="p-4 hidden sm:table-cell">
                {format(account.lastUpdated, "MMM dd, yyyy")}
                {isStale(account.lastUpdated) && " (stale)"}
              </TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.trend}</TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.interestRate}</TableCell>
              <TableCell className="p-4 hidden md:table-cell text-right">{account.interestYoY}</TableCell>
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
  );
};

export default AccountsPage;
