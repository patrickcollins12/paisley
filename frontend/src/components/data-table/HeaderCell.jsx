import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils.js"
import { Button } from "@/components/ui/button.jsx"
import { ArrowDownNarrowWide, ArrowDownWideNarrow, ArrowUpDown } from "lucide-react"
import { useLogger } from "react-use"

const variants = cva(
  ['flex', 'space-x-2'],
  {
    variants: {
      align: {
        right: ['text-right']
      }
    }
  }
)

function HeaderCell({ header, column, align }) {
  // useLogger('HeaderCell', column);

  const sorting = column.getIsSorted();

  function handleSort() {
    column.toggleSorting();
  }

  return (
    <div className={cn(variants({ align }))}>
      <div className='flex-1 leading-6'>
        {header.column.columnDef.meta.displayName ?? '__UNKNOWN__'}
      </div>
      <div className='flex-none'>
        <Button onClick={handleSort} variant={sorting ? 'outline' : 'ghost'} className='px-1 py-1 size-6'>
          {!sorting && <ArrowUpDown size={14} />}
          {sorting === 'asc' && <ArrowDownNarrowWide size={14} className='text-accent-foreground' />}
          {sorting === 'desc' && <ArrowDownWideNarrow size={14} className='text-accent-foreground' />}
        </Button>
      </div>
    </div>
  )
}

export default HeaderCell;