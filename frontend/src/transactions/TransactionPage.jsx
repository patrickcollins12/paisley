import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from 'react';
import { DataTable } from "@/components/data-table/DataTable.jsx";
import { createColumnDefinitions } from "./TransactionColumnDefinitions.jsx";
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions, useUpdateTransaction } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { getRouteApi } from "@tanstack/react-router";
import { useUpdateEffect } from "react-use"
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import QuickRuleModal from "@/rules/QuickRuleModal.jsx";

const routeApi = getRouteApi('/transactions/');

const defaultColumnVisibility = {
  id: false,
  debit: false,
  credit: false,
  balance: false,
  account_number: false,
  account_currency: false
};

const initialiseSortState = (searchParams) => {
  if (!searchParams.order_by) return [];

  const orderByParts = searchParams.order_by.split(',');
  if (orderByParts.length !== 2) return [];

  return [{
    id: orderByParts[0],
    desc: orderByParts[1] === 'desc'
  }];
};

export default function TransactionPage() {

  const { t } = useTranslation();

  // navigate is used to update URL search params
  const navigate = routeApi.useNavigate();

  // search context (this is NOT the search params but how search_ids are generated)
  const searchContext = useSearch();

  // search params (this IS the search params that you see in the URL)
  const urlSearchParams = routeApi.useSearch();

  // column visibility state - meaning what columns are shown and hidden
  const [columnVisibilityState, setColumnVisibilityState] = useState(defaultColumnVisibility);
  
  // Quick Rule modal state
  const [isQuickRuleModalOpen, setIsQuickRuleModalOpen] = useState(false);
  const [quickRuleInitialString, setQuickRuleInitialString] = useState('');

  // pagination state - composed of the number of items per page (pageSize) and current page number (pageIndex)
  const [pageState, setPageState] = useState({
    pageIndex: urlSearchParams.page - 1,
    pageSize: urlSearchParams.page_size
  });

  // sort state - which column we are currently sorting on; there can only be one right now
  const [sortState, setSortState] = useState(initialiseSortState(urlSearchParams));

  // synchronise changes to pagination and sorting state to URL search params
  // TODO: This is some fugly bullshit right here. Need a better way to manage this shite.
  const updateUrlSearchParams = useCallback((pageState, sortState) => {
    navigate({
      search: previous => ({
        page: pageState.pageIndex + 1,
        page_size: pageState.pageSize,
        ...(sortState.length > 0 && {order_by: `${sortState[0].id},${sortState[0].desc ? 'desc' : 'asc'}`}),
        ...(previous.search_id && {search_id: previous.search_id})
      })
    });
  }, []);

  // synchronise changes to pagination and sorting state to URL search params
  useUpdateEffect(() => {
    updateUrlSearchParams(pageState, sortState);
  }, [sortState, pageState]);

  // when filters change we need to reset the page index back to 0
  useUpdateEffect(() => {
    setPageState(prevState => ({
      ...prevState,
      pageIndex: 0,
    }));
  }, [searchContext.calculateSearchId()]);

  // finally we fetch the data using the search (filters) state, sorting and pagination state
  const { data, mutate } = useFetchTransactions({
    pageIndex: pageState.pageIndex,
    pageSize: pageState.pageSize,
    filters: searchContext.getFilters(),
    orderBy: sortState.length > 0 ? { field: sortState[0].id, dir: sortState[0].desc ? 'desc' : 'asc' } : null,
  });
  const { update: updateTransaction } = useUpdateTransaction();

  function handleTransactionUpdate(id, transactionData) {
    // console.log('handleTransactionUpdate:begin', id, transactionData);
    updateTransaction(id, transactionData).then(result => {
      // console.log('update transaction result', result);
    });
  }
  
  // Handler for the Quick Rule button
  function handleQuickRuleClick(description) {
    // Format the description as a rule string
    const ruleString = `description = '${description}'`;
    setQuickRuleInitialString(ruleString);
    setIsQuickRuleModalOpen(true);
  }

  // const columns = useMemo(() => createColumnDefinitions(handleTransactionUpdate), []);
  const columns = useMemo(() => createColumnDefinitions(handleTransactionUpdate, t, handleQuickRuleClick), [t, handleTransactionUpdate, handleQuickRuleClick]);

  const table = useReactTable({
    data: data?.results ?? [],
    resultsSummary: data?.resultSummary ?? {},
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting: sortState,
      columnVisibility: columnVisibilityState,
      pagination: pageState
    },
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    rowCount: data?.resultSummary.count,
    onColumnVisibilityChange: setColumnVisibilityState,
    onSortingChange: setSortState,
    onPaginationChange: setPageState
  });
return (
  <>
    <Toolbar
      dataTable={table}
    />

    <DataTable
      paginated
      data={data}
      table={table}
      columnVisibilityState={columnVisibilityState}
    />
    
    {/* Quick Rule Modal */}
    <Dialog open={isQuickRuleModalOpen} onOpenChange={setIsQuickRuleModalOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Quick Rule</DialogTitle>
        </DialogHeader>
        {isQuickRuleModalOpen && (
          <QuickRuleModal
            key={quickRuleInitialString}
            initialRuleString={quickRuleInitialString}
            onSaveComplete={() => {
              // Refresh the transaction list after saving the rule
              mutate();
              setIsQuickRuleModalOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  </>
)
}
