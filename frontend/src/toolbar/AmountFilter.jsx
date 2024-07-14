import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import React, { useEffect, useState } from "react"
import FilterButton from "@/toolbar/FilterButton.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Input } from "@/components/ui/input.jsx"
import { CircleDollarSignIcon, NotepadText as DescriptionIcon } from "lucide-react"
import { defaultOperator, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useDebounce } from "react-use"

const fieldList = [
  { id: 'amount', label: 'Amount' },
  { id: 'debit', label: 'Debit' },
  { id: 'credit', label: 'Credit' }
];
const filterRegex = /([0-9]{0,}(?:\.[0-9]{0,2})?)/;

function AmountFilter({ operators, onFilterUpdate, onFilterClear }) {

  const [field, setField] = useState(fieldList[0]);
  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(defaultOperator(operators));
  const [operatorOnly, setOperatorOnly] = useState(operators[defaultOperator(operators)]?.operatorOnly ?? false);
  const operatorDef = operators[operator];

  useDebounce(() => {
    setDebouncedValue(value);
  }, 500, [value]);

  useEffect(() => {
    if (debouncedValue) {
      setIsFilterActive(true);
      onFilterUpdate(filterExpression(field.id, operatorDef, debouncedValue));
    } else {
      setIsFilterActive(false);
      onFilterClear(field.id);
    }
  }, [debouncedValue]);

  const handleClear = (event) => {
    event.stopPropagation();

    setValue('');
    setDebouncedValue('');
    setIsFilterActive(false);
  };

  const handleInput = (event) => {
    const matches = filterRegex.exec(event.target.value);
    if (!matches) return;
    setValue(matches[0]);
  }

  function renderButtonLabel(label) {
    const icon = (<CircleDollarSignIcon className="h-4 w-4 mr-2" />);

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
            <Select value={field.id} className="border border-3" onValueChange={field => setField(field)}>
              <SelectTrigger className="border h-8 text-xs w-[200px] inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldList.map(field => (
                  <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

            <Input
              placeholder="amount ..."
              autoFocus
              onChange={handleInput}
              value={value}
              className="h-8 w-full pr-6"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AmountFilter;