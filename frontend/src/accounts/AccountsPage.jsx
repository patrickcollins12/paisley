import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Link, useNavigate } from "@tanstack/react-router";
import GlobalFilter from "@/toolbar/GlobalFilter.jsx";
import { Skeleton } from "@/components/ui/skeleton"
import useAccountData from "@/accounts/AccountApiHooks.js";
import { formatInterest } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import AccountSparkLine from "@/accounts/AccountSparkLine.jsx";
import { useTranslation } from 'react-i18next';

import logos from '/src/logos/logos.json';

const AccountsPage = () => {
  const navigate = useNavigate({ from: "/accounts" });
  const { data, error, isLoading } = useAccountData();
  const [accounts, setAccounts] = useState([]);
  const [totalAssets, setTotalAssets] = useState([]);
  const [totalLiabilities, setTotalLiabilities] = useState([]);
  const [netWorth, setNetWorth] = useState([]);

  const { t, i18n } = useTranslation();


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
      const updatedAccounts = Object.values(accountMap) //.filter(acc => !acc.parentid);

      // Sort accounts by custom sortOrder
      // Custom sort order for account types
      // TODO: this sort will fail when int8'n is not in the sortOrder
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

      // calculate total assets, liabilities and net worth
      setTotalAssets(
        sortedAccounts
          .filter(acc => !acc.parentid) // only top-level accounts
          .filter((acc) => acc.category === "asset")
          .reduce((sum, acc) => sum + acc.balance, 0)
      );

      setTotalLiabilities(
        sortedAccounts
          .filter(acc => !acc.parentid) // only top-level accounts
          .filter((acc) => acc.category === "liability")
          .reduce((sum, acc) => sum + acc.balance, 0)
      );

      setNetWorth(totalAssets + totalLiabilities);

    }
  }, [data]);

  function renderAccountDetails(category, totalValue, what_i_own_or_owe, total_assets_or_liabilities) {
    return <>

      {/* Assets Title */}
      <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
        <TableCell className="md:table-cell p-2 font-bold" colSpan="7">
          {t(what_i_own_or_owe)}
        </TableCell>
      </TableRow>


      {accounts && accounts.filter((acc) => acc.category === category).map((account, index) => (

        <TableRow
          key={index}
          className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
          onClick={() => navigate({ to: `/account/${account.accountid}` })}
        >

          {/* Icon and Short Name */}
          <TableCell className="p-1 font-medium hover:underline  ">
            <div className="flex items-center gap-3">
              {logos && logos[account.institution] && logos[account.institution]['location'] &&
                <span className={`ml-3 p-1 border ${logos[account.institution]['background']} rounded-lg`}>
                  <img className="h-5" src={`${logos[account.institution]['location']}`} />
                </span>}
              <span>{account.shortname}</span>
            </div>
          </TableCell>

          {/* Account Type */}
          <TableCell className="p-1">{account.type}</TableCell>

          {/* Account Balance */}
          <TableCell className="p-1 text-right">
            {formatCurrency(account.balance, { currency: account.currency })}
          </TableCell>

          {/* Last Updated */}
          <TableCell className={`p-1 hidden sm:table-cell text-xxs opacity-50 ${isStale(account.balance_datetime) ? 'text-red-500' : ''}`}>
            <DateTimeDisplay datetime={account.balance_datetime} options={{ delta: true, absolute: false }} />
          </TableCell>

          {/* Sparkline */}
          <TableCell className="p-0 hidden md:table-cell text-right">
            {account && account.accountid &&
              <AccountSparkLine accountid={account.accountid} />
            }
          </TableCell>

          {/* Interest */}
          <TableCell className="p-1 hidden md:table-cell text-right">{formatInterest(account.interest)}</TableCell>

        </TableRow>
      ))}

      {/* Total Assets Rows */}
      <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
        <TableCell colSpan="2" className="p-2">{t(total_assets_or_liabilities)}</TableCell>
        <TableCell className="p-1 text-right">{formatCurrency(totalValue, { currency: "AUD" })}</TableCell>
        <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
        <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>
      </TableRow>

    </>
  }

  return (
    <>


      <div className="flex flex-row mb-4">
            <div className="flex flex-row basis-1/2 space-x-2">
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link to="/rules/new">
                  <PlusIcon size={16} className="mr-1" />
                  Create Account
                </Link>
              </Button>
              <GlobalFilter dataTable={table} />
            </div>
          </div>


      <div className="flex flex-col items-center mb-4">
        <div className="overflow-auto inline-block">

          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="p-2">{t("Account Name")}</TableHead>
                <TableHead className="p-1">{t("Account Type")}</TableHead>
                <TableHead className="p-1 text-right">{t("Balance")}</TableHead>
                <TableHead className="p-1 hidden sm:table-cell">{t("Last Balance")}</TableHead>
                <TableHead className="p-1 hidden md:table-cell">{t("1 year")}</TableHead>
                <TableHead className="p-1 hidden md:table-cell text-right">{t("Interest Rate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {error ? (
                <TableRow>
                  {/* Network error */}
                  <TableCell colSpan={7} className="text-center">
                    {t("Error loading accounts data")}
                  </TableCell>
                </TableRow>) :

                (isLoading || !data || (accounts && accounts.length === 0)) ? (
                  <TableRow>
                    {/* Show skeleton loader while loading data */}
                    <TableCell><Skeleton className="w-[155px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[61px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[65px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[55px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[55px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[48px] h-[20px]" /></TableCell>
                    <TableCell><Skeleton className="w-[48px] h-[20px]" /></TableCell>
                  </TableRow>

                ) : (
                  <>
                    {/* If loaded, let's display the table! */}

                    {renderAccountDetails(    "asset",      totalAssets,      "What I own (Assets)",      "Total (Assets)")}
                    {renderAccountDetails("liability", totalLiabilities, "What I owe (Liabilities)", "Total (Liabilities)")}

                    {/* Net worth */}
                    <TableRow className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 font-bold">
                      <TableCell colSpan="2" className="p-2">{t("Net Worth")}</TableCell>
                      <TableCell className="p-1 text-right">{formatCurrency(netWorth, { currency: "AUD" })}</TableCell>
                      <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
                      <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>
                    </TableRow>
                  </>
                )}

            </TableBody>
          </Table>

        </div>
      </div>
    </>
  );
};

export default AccountsPage;
