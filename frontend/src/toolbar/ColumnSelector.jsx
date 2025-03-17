import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ChevronDown } from "lucide-react"
import { formatCamelCase } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

function ColumnSelector({ dataTable }) {
  const { t, i18n } = useTranslation();

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
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={() => {
                  column.toggleVisibility();
                }}
              >
                {formatCamelCase(column.columnDef?.meta?.displayName|| column.id) }
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ColumnSelector;