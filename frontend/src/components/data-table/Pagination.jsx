import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

export const pageSizeOptions = [
  { key: 25, value: '25 rows' },
  { key: 50, value: '50 rows' },
  { key: 100, value: '100 rows' },
  { key: 200, value: '200 rows' },
  { key: 500, value: '500 rows' },
  { key: 1000, value: '1000 rows' }
]

export default function Pagination({ dataTable }) {

  const pageState = dataTable.getState().pagination;
  const pageSize = pageState.pageSize;
  const pageIndex = pageState.pageIndex;
  const rangeStart = (pageIndex * pageSize) + 1;
  const rangeMax = dataTable.getRowCount();
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, rangeMax);
  const pageMax = Math.ceil(rangeMax / pageSize);

  function handlePageChange(direction) {
    if (direction > 0 && pageIndex < pageMax - 1) {
      dataTable.setPageIndex(pageState.pageIndex + 1);
    }
    else if (direction < 0) {
      dataTable.setPageIndex(pageState.pageIndex - 1);
    }
  }

  return (
    <div className='flex justify-center pt-2 border-t border-accent'>
      <div className='flex flex-row space-x-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className='h-8 font-normal'>
              {pageSize} rows per page <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {pageSizeOptions
              .map((option) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={option.key}
                    checked={pageSize === option.key}
                    onCheckedChange={() => {
                      dataTable.setPageSize(option.key);
                    }}
                  >
                    {option.value}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className='text-sm leading-8'>
          {rangeStart} - {rangeEnd} of {rangeMax}
        </div>
        <Button disabled={!dataTable.getCanPreviousPage()} onClick={() => handlePageChange(-1)} variant='ghost' className='size-8 p-2'>
          <ChevronLeft size={16} />
        </Button>
        <Button disabled={!dataTable.getCanNextPage()} onClick={() => handlePageChange(1)} variant='ghost' className='size-8 p-2 !ml-0'>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}