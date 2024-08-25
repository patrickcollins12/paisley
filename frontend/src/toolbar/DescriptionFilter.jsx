import { NotepadText as DescriptionIcon } from "lucide-react"
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
import { useDebounce } from "react-use"
import { defaultOperator, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useUpdateEffect } from "react-use"
import { useSearch } from "@/components/search/SearchContext.jsx"

function DescriptionFilter({ operators }) {

  const fieldName = 'description';
  const searchContext = useSearch()
  const activeFilters = searchContext.getFilters(fieldName);

  const [value, setValue] = useState(activeFilters.length > 0 ? activeFilters[0].value : '');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(activeFilters.length > 0 ? activeFilters[0].operatorDefinition.id : defaultOperator(operators));
  const operatorDef = operators[operator];

  // TODO: Handle operator changes more gracefully. Meaning when you switch from an operatorOnly field
  // then the popover should remain open.
  const handleUpdate = () => {
    if (!value && !('operatorOnly' in operatorDef)) {
      searchContext.clearFilters(fieldName);
      return;
    }

    if ('operatorOnly' in operatorDef) {
      setPopoverOpen(false);
    }

    searchContext.updateFilters(filterExpression(fieldName, operatorDef, 'operatorOnly' in operatorDef ? '' : value));
  }

  useDebounce(handleUpdate, 500, [value]);
  useUpdateEffect(handleUpdate, [operator]);

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
          {'getValue' in operatorDef ?
            <span>{operatorDef.getValue(activeFilters[0])}</span>
            :
            <span>{activeFilters[0].value}</span>
          }
        </span>
      </>
    )
  }

  // TODO: needs a debounce
  const handleInputFilterBlur = (evt) => {
    setValue(evt.target.value)
    // setIsFilterActive(true)
  }

  const handleClear = (event) => {
    event.stopPropagation();

    setValue('');
    // setIsFilterActive(false);
    setPopoverOpen(false);

    // reset to default option
    setOperator(defaultOperator(operators));
    // setOperatorOnly(operators[defaultOperator(operators)]?.operatorOnly ?? false);

    searchContext.clearFilters(fieldName);
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div><FilterButton
          isFilterActive={searchContext.isFilterActive(fieldName)}
          label="Description"
          onClear={handleClear}
          activeRenderer={renderButtonLabel}
        /></div>

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

            {!('operatorOnly' in operatorDef) && <Input
              placeholder="description..."
              autoFocus
              onChange={handleInputFilterBlur}
              // onChange = { (e) => {setValue(e.target.value)} }
              value={value}
              className="h-8 w-full pr-6"
            />}
          </div>
        </div>
      </PopoverContent>
    </Popover >
  )
}

export default DescriptionFilter;
