import { DataTable } from "@/components/data-table/DataTable.jsx"
import { createColumnDefinitions } from "@/rules/RuleColumnDefinitions.jsx"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import { useFetchRules, useUpdateRules } from "@/rules/RuleApiHooks.jsx"
import { useMemo, useState } from "react"
import GlobalFilter from "@/toolbar/GlobalFilter.jsx"
import ColumnSelector from "@/toolbar/ColumnSelector.jsx"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import { Link } from "@tanstack/react-router"

function filterString(value, filterValue) {
  return value
    ?.toString()
    ?.toLocaleLowerCase()
    ?.includes(filterValue?.toLocaleLowerCase()) ?? false;
}

function filterTag(value, filterValue) {
  return value
    ?.find(tag => tag?.toString()?.toLocaleLowerCase()?.includes(filterValue?.toLocaleLowerCase())) ?? false;
}

const filterFuncs = {
  rule: (ruleData, filterValue) => filterString(ruleData.rule, filterValue),
  tag: (ruleData, filterValue) => filterTag(ruleData.tag, filterValue),
  party: (ruleData, filterValue) => filterTag(ruleData.party, filterValue),
  comment: (ruleData, filterValue) => filterString(ruleData.comment, filterValue)
}

export default function RulePage() {
  // useLogger('RulesPage');

  const [pageState, setPageState] = useState({ pageSize: 100, pageIndex: 0 });
  const [columnVisibilityState, setColumnVisibilityState] = useState({ id: false, comment: false });
  const [globalFilterState, setGlobalFilterState] = useState();
  const [sortState, setSortState] = useState([]);
  const { data } = useFetchRules();
  const { update, remove } = useUpdateRules();
  const columns = useMemo(() => createColumnDefinitions(update, remove), []);
  const table = useReactTable({
    data: data ?? [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter: globalFilterState,
      sorting: sortState,
      columnVisibility: columnVisibilityState,
      pagination: pageState,
    },
    onSortingChange: setSortState,
    onGlobalFilterChange: setGlobalFilterState,
    onColumnVisibilityChange: setColumnVisibilityState,
    onPaginationChange: setPageState,
    getColumnCanGlobalFilter: (options) => {
      return options.id in filterFuncs;
    },
    globalFilterFn: (row, columnId, filterValue) => {
      return filterFuncs[columnId]?.(row.original, filterValue) ?? false;
    }
  });

  return (
    <>
      <div className="flex flex-row mb-4">

        <div className="flex flex-row basis-1/2 space-x-2">
          <Button variant='outline' size='sm' className='h-8' asChild>
            <Link to="/rules/new">
              <PlusIcon size={16} className='mr-1'/>
              Create Rule
            </Link>
          </Button>

          <GlobalFilter dataTable={table} />
        </div>

        <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
          <ColumnSelector dataTable={table} />
        </div>

      </div>

      <DataTable
        paginated
        data={data}
        table={table}
        sortState={sortState}
        globalFilterState={globalFilterState}
        columnVisibilityState={columnVisibilityState}
        pageState={pageState}
      />
    </>

  )
}