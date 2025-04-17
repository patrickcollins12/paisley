import { flexRender } from "@tanstack/react-table"
import Pagination from "@/components/data-table/Pagination.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx"

// Temporarily remove React.memo to debug resizing
export function DataTable({ table, data, ...props }) {

  const showPagination = 'paginated' in props;

  return (
    <>
      <Table className="text-xs">
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead 
                  key={header.id} 
                  colSpan={header.colSpan} 
                  style={{ width: header.getSize(), position: 'relative' }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute top-0 right-0 h-full w-[5px] -translate-x-1/2 cursor-col-resize select-none touch-none group-hover:bg-border ${header.column.getIsResizing() ? 'bg-primary' : ''}`}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {data &&
          <TableBody>
            {table.getFooterGroups().map(footerGroup => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map(footer => (
                  <TableCell key={footer.id}>
                    {flexRender(footer.column.columnDef.footer, footer.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} className="group">
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
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
}