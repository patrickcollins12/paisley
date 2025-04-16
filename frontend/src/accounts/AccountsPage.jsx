import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { Link, useNavigate } from "@tanstack/react-router";
import GlobalFilter from "@/toolbar/GlobalFilter.jsx";
import { Skeleton } from "@/components/ui/skeleton"
import useAccountData from "@/accounts/AccountApiHooks.js";
import { formatInterest } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';

import AccountSparkLine from "@/accounts/AccountSparkLine.jsx";
import { useTranslation } from 'react-i18next';

import AccountIcon from './AccountIcon';

const AccountsPage = () => {
  const navigate = useNavigate({ from: "/accounts" });
  const { data, error, isLoading } = useAccountData();
  const [accounts, setAccounts] = useState([]);
  const [showInactive, setShowInactive] = useState(false); // <-- NEW

  const [totalAssets, setTotalAssets] = useState([]);
  const [totalLiabilities, setTotalLiabilities] = useState([]);
  const [netWorth, setNetWorth] = useState([]);

  const { t } = useTranslation();

  ////////
  // row expanding functionality
  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpand = (accountid) => {
    setExpandedRows((prev) => ({
      ...prev,
      [accountid]: !prev[accountid], // Toggle expansion
    }));
  };

  ////////
  // filtering functionality
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  function filterAccounts(accounts, searchTerm) {
    if (!searchTerm) return accounts; // If no search term, return full list
    const lowerSearch = searchTerm.toLowerCase();
    return accounts.filter(
      (account) =>
        account.shortname.toLowerCase().includes(lowerSearch) ||
        account.institution.toLowerCase().includes(lowerSearch) ||
        account.name.toLowerCase().includes(lowerSearch) ||
        account.type.toLowerCase().includes(lowerSearch)
    );
  }

  // `dataTable` to pass into `GlobalFilter`
  const dataTable = {
    setGlobalFilter: (value) => setSearchTerm(value), // Updates search term
    resetGlobalFilter: () => setSearchTerm("") // Clears search term
  };

  // Update filtered accounts when the search term changes
  useEffect(() => {
    setFilteredAccounts(filterAccounts(accounts, searchTerm));
  }, [accounts, searchTerm]);


  const isStale = (date) => (new Date() - new Date(date)) / (1000 * 60 * 60 * 24) > 8;

  //////////////////
  // setup the data
  useEffect(() => {
    // Data fetched from the API (`useAccountData`) is now pre-aggregated and pre-sorted on the server.
    if (data) {

      // Filter by active/inactive status (client-side toggle)
      const relevantAccounts = showInactive ? data : data.filter(acc => acc.status !== "inactive");

      // Data is already aggregated and sorted, just update state.
      setAccounts(relevantAccounts);

      // Calculate totals based on the received (already aggregated) accounts
      setTotalAssets(
        relevantAccounts 
          .filter((acc) => acc.category === "asset")
          .reduce((sum, acc) => sum + (acc.balance || 0), 0)
      );

      setTotalLiabilities(
        relevantAccounts
          .filter((acc) => acc.category === "liability")
          .reduce((sum, acc) => sum + (acc.balance || 0), 0)
      );

      // Corrected net worth:
      // Note: We calculate totals *after* applying the showInactive filter client-side.
      // This means totals reflect only the currently visible accounts.
      // If totals should always reflect *all* active accounts regardless of the toggle,
      // this calculation would also need to move server-side or use the unfiltered `data`.
      const currentAssets = relevantAccounts.filter(a => a.category === 'asset').reduce((sum, a) => sum + (a.balance || 0), 0);
      const currentLiabilities = relevantAccounts.filter(a => a.category === 'liability').reduce((sum, a) => sum + (a.balance || 0), 0);
      setNetWorth(currentAssets - Math.abs(currentLiabilities)); 

    }
  }, [data, showInactive]); // Depend on fetched data and the toggle


  //////////////////
  // render each row
  function renderAccountDetails(category, totalValue, what_i_own_or_owe, total_assets_or_liabilities) {

    return (
      <>
        {/* Assets Title */}
        <TableRow className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
          <TableCell />
          <TableCell className="md:table-cell p-2 font-bold" colSpan="7">
            {t(what_i_own_or_owe)}
          </TableCell>
        </TableRow>

        {filteredAccounts &&
          filteredAccounts
            .filter((acc) => acc.category === category) // only liability or asset accounts
            .filter((acc) => !acc.parentid) // only top-level accounts
            .map((account, index) => (
              <React.Fragment key={account.accountid}>{renderRow(account)}</React.Fragment>
            ))}

        {/* Total Assets Rows */}
        <TableRow className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold">
          <TableCell />
          <TableCell colSpan="2" className="p-2">{t(total_assets_or_liabilities)}</TableCell>
          <TableCell className="p-1 text-right">{formatCurrency(totalValue, { currency: "AUD" })}</TableCell>
          <TableCell colSpan="1" className="p-1 font-bold hidden sm:table-cell"></TableCell>
          <TableCell colSpan="3" className="p-1 font-bold hidden md:table-cell"></TableCell>
        </TableRow>
      </>
    );

    function renderRow(account) {
      const isParent = account.parentid === null;
      const hasChildren = account.hasChildren; // Comes from useEffect marking parents
      const isExpanded = expandedRows[account.accountid];

      return (
        <>
          {/* Parent Row */}
          <TableRow
            key={account.accountid}
            className="border-t bg-opacity-90 transition duration-150 cursor-pointer"
            onClick={() => navigate({ to: `/account/${account.accountid}` })}
          >

            <TableCell className={`p-1 ${isParent ? "" : ""} font-medium`}>
              {/* Expand/Collapse Icon */}
              {isParent && hasChildren && (
                <button
                  className="focus:outline-none"
                  onClick={(event) => {
                    event.stopPropagation(); // Prevents the row click from triggering
                    toggleExpand(account.accountid);
                  }}
                >
                  {<ChevronRight
                    size={16}
                    className={`transition-transform m-0 p-0 duration-200 ${isExpanded ? "rotate-90" : ""}`}
                  />}
                </button>
              )}

            </TableCell>

            { /* indent the row if it's a child account */}
            <TableCell className={`p-1 ${isParent ? "" : "pl-4"} font-medium`}>
              <div className="flex items-center gap-0">
                {/* Replace logo logic with the new component */}
                <AccountIcon institution={account.institution} type={account.type} />

                {/* Account Name */}
                {/* <span>{account.shortname}</span> */}
                <span className="hover:underline">{account.shortname}</span>


                {/* Show status if status is not "active" */}
                {account.status !== "active" && (
                  <span className="ml-1 text-muted-foreground">({account.status})</span>
                )}



              </div>
            </TableCell>

            {/* Account Type */}
            <TableCell className="p-1">{account.type}</TableCell>

            {/* Account Balance */}
            <TableCell className="p-1 text-right">
              {formatCurrency(account.balance, { currency: account.currency })}
            </TableCell>

            {/* Last Updated */}
            <TableCell className={`p-1 hidden sm:table-cell text-xxs opacity-50 ${isStale(account.balance_datetime) ? "text-red-500" : ""}`}>
              <DateTimeDisplay datetime={account.balance_datetime} options={{ delta: true, absolute: false }} />
            </TableCell>

            {/* Sparkline */}
            <TableCell className="p-0 hidden md:table-cell text-right">
              {account.accountid && <AccountSparkLine accountid={account.accountid} />}
            </TableCell>

            {/* Interest */}
            <TableCell className="p-1 hidden md:table-cell text-right">{formatInterest(account.interest)}</TableCell>
          </TableRow>

          {/* Render Child Rows if Expanded */}
          {isExpanded && account.children && account.children.length > 0 && (
            account.children
              // Optionally filter children based on showInactive toggle if needed
              .filter(child => showInactive || child.status !== 'inactive') 
              .map((subAccount) => (
                <React.Fragment key={subAccount.accountid}>{renderRow(subAccount)}</React.Fragment>
              ))
          )}
        </>
      );
    }

  }

  //////////////////
  // main render component
  return (
    <>
      <div className="flex flex-row mb-4">
        <div className="flex flex-row basis-1/2 space-x-2">

          <Button variant="outline" size="sm" className="h-8" asChild>
            <Link to="/account_edit/new">
              <PlusIcon size={16} className="mr-1" />
              {t("Create Account")}
            </Link>
          </Button>

          <GlobalFilter dataTable={dataTable} />

          {/* Show Inactive Toggle - Only shown if inactive accounts exist */}
          {data?.some(acc => acc.status === "inactive") && (
            <div className="flex items-center space-x-2 text-sm">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
              <label htmlFor="show-inactive">{t("Show Inactive")}</label>
            </div>
          )}

        </div>
      </div >

      <div className="flex flex-col items-center mb-4">
        <div className="overflow-auto inline-block">

          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="p-2">{/* chevron */}</TableHead>
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

                    {renderAccountDetails("asset", totalAssets, "What I own (Assets)", "Total (Assets)")}
                    {renderAccountDetails("liability", totalLiabilities, "What I owe (Liabilities)", "Total (Liabilities)")}

                    {/* Net worth */}
                    <TableRow className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 font-bold">
                      <TableCell />
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
