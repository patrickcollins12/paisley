import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ChevronDown } from "lucide-react"
import { formatCamelCase } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

function ColumnSelector({ dataTable, currentColumnSizing, onResetLayout }) {
  const { t, i18n } = useTranslation();

  const showReset = onResetLayout && Object.keys(currentColumnSizing ?? {}).length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className='h-8'>
          {t("Columns")} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {dataTable
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={() => {
                column.toggleVisibility();
              }}
            >
              {formatCamelCase(column.columnDef?.meta?.displayName|| column.id) }
            </DropdownMenuCheckboxItem>
          ))}
        {showReset && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onResetLayout}> 
              {t("Reset Column Sizes")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ColumnSelector;