import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx"
import { flexRender } from "@tanstack/react-table"
import Pagination from "@/components/data-table/Pagination.jsx"

export const DataTable = memo(function TransactionsDataTable({ table, data, ...props }) {

  const showPagination = 'paginated' in props;

  return (
    <>
      <Table className="text-xs">
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} style={
                  header.column.columnDef.width ? {
                    width: header.column.columnDef.width
                  } : {}
                }>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {data &&
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        }
      </Table>

      <Pagination dataTable={table} />
    </>
  )
});