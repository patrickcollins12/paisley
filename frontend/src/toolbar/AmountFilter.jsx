import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import React, { useState } from "react"
import FilterButton from "@/toolbar/FilterButton.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Input } from "@/components/ui/input.jsx"
import { NotepadText as DescriptionIcon } from "lucide-react"
import { defaultOperator } from "@/toolbar/FilterExpression.jsx"

function AmountFilter({ operators, onFilterUpdate, onFilterClear }) {

  const fieldName = 'amount';
  const [value, setValue] = useState()
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(defaultOperator(operators));
  const [operatorOnly, setOperatorOnly] = useState(operators[defaultOperator(operators)]?.operatorOnly ?? false);
  const operatorDef = operators[operator];

  const handleClear = () => {

  };

  function renderButtonLabel(label) {
    const icon = (<DescriptionIcon className="h-4 w-4 mr-2" />);

    return (
      <>
        <span>{icon}</span>
        <span className="inline-flex gap-1 w-auto text-nowrap">
          <span className="opacity-40">{label}</span>

          {'short' in operatorDef ?
            <span>{operatorDef.short}</span>
            :
            <span>{operatorDef.label}</span>
          }
          <span>{value}</span>
        </span>
      </>
    )
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div>
          <FilterButton
            isFilterActive={isFilterActive}
            label="Amount"
            onClear={handleClear}
            activeRenderer={renderButtonLabel}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align='start' className="w-auto">
        <div className="text-xs">
          <div className="flex flex-col gap-3 items-start mb-3">
            <Select value={operator} className="border border-3" onValueChange={operatorValue => setOperator(operatorValue)}>
              <SelectTrigger className="border h-8 text-xs w-[200px] inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operators).map(([value, obj]) => (
                  <SelectItem key={value} value={value}>{obj.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover >
  )
}

export default AmountFilter;