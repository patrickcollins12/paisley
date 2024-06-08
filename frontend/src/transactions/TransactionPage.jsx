import {
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table"

import { useMemo, useState } from 'react';

import { DataTable } from "@/components/data-table/DataTable.jsx"

// column definitions moved out to a separate file
import { createColumnDefinitions } from "./TransactionColumnDefinitions.jsx"

import Toolbar from "@/toolbar/Toolbar.jsx"
import { useFetchTransactions, useUpdateTransaction } from "@/transactions/TransactionApiHooks.jsx"
import { useTransactionSearchParams } from "@/transactions/TransactionSearchParamsHooks.jsx"

function TransactionPage() {
  const [customFilterState, setCustomFilterState] = useState([]);
  const {
    filterState, setFilterState,
    sortState, setSortState,
    pageState, setPageState
  } = useTransactionSearchParams();
  const [columnVisibilityState, setColumnVisibilityState] = useState({
    debit: false,
    credit: false,
  });
  const { data } = useFetchTransactions({
    pageIndex: pageState.pageIndex,
    pageSize: pageState.pageSize,
    filters: customFilterState,
    orderBy: sortState.length > 0 ? { field: sortState[0].id, dir: sortState[0].desc ? 'desc' : 'asc' } : null,
  });
  const { update: updateTransaction } = useUpdateTransaction();

  function handleTransactionUpdate(id, transactionData) {
    console.log('handleTransactionUpdate:begin', id, transactionData);
    updateTransaction(id, transactionData).then(result => {
      console.log('update transaction result', result);
    });
  }

  function handleFilterUpdate(filterExpression) {
    console.log('handleFilterUpdate', filterExpression);

    setCustomFilterState((prevState) => {
      // find any previous matching entries by field
      const existingFieldFilter = prevState.find(filter => filter.field === filterExpression.field);

      if (existingFieldFilter) {
        return [filterExpression, ...prevState.filter(filter => filter.field !== filterExpression.field)];
      }

      return [filterExpression, ...prevState];
    });
  }

  function handleFilterClear(fieldName) {
    console.log('handleFilterClear', fieldName);

    setCustomFilterState(prevState => {
      return [...prevState.filter(filter => filter.field !== fieldName)];
    })
  }

  const columns = useMemo(() => createColumnDefinitions(handleTransactionUpdate), []);
  const table = useReactTable({
    data: data?.results ?? [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting: sortState,
      columnFilters: filterState,
      columnVisibility: columnVisibilityState,
      pagination: pageState
    },
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    rowCount: data?.resultSummary.count,
    onColumnVisibilityChange: setColumnVisibilityState,
    onSortingChange: setSortState,
    onPaginationChange: setPageState,
    onColumnFiltersChange: setFilterState
  });

  return (
    <>
      <Toolbar
        dataTable={table}
        onFilterUpdate={handleFilterUpdate}
        onFilterClear={handleFilterClear}
      />

      <DataTable
        paginated
        data={data}
        table={table}
        columnVisibilityState={columnVisibilityState}
      />
    </>
  )
}

export default TransactionPage;