import { NotepadText as DescriptionIcon } from "lucide-react"
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
import useDebounce from './useDebounce.jsx';
import { defaultOperator, filterExpression, stringOperators } from "@/toolbar/RuleCreator.jsx"
import { useUpdateEffect } from "react-use"

// import FilterButton from './FilterButton'; // Adjust the path as necessary

function DescriptionFilter({ operators, onFilterUpdate, onFilterClear }) {

  const fieldName = 'description';
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 7);

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(defaultOperator(operators));
  const [operatorOnly, setOperatorOnly] = useState(operators[defaultOperator(operators)]?.operatorOnly ?? false);
  const operatorDef = operators[operator];

  // handle changes to the debounced input value
  useUpdateEffect(() => {
    // perform any action using the debounced value
    // this will be triggered only after the specified delay (500ms in this example)
    // console.log('Debounced value:', debouncedValue);

    onFilterUpdate(filterExpression(fieldName, operatorDef, debouncedValue));
  }, [debouncedValue]);

  // handle change to the selected operator
  useUpdateEffect(() => {
    // check whether the operator that has been selected is "operatorOnly"
    // this essentially means the user does not need to select a value
    if (operatorDef?.operatorOnly) {
      setValue('');
      setIsFilterActive(true);
      setPopoverOpen(false);
      setOperatorOnly(true);

      onFilterUpdate(filterExpression(fieldName, operatorDef, null));
    } else {
      setOperatorOnly(false);

      onFilterUpdate(filterExpression(fieldName, operatorDef, debouncedValue));
    }
  }, [operator]);

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
          {'formatValue' in operatorDef ?
            <span>{operatorDef.formatValue(debouncedValue)}</span>
            :
            <span>{debouncedValue}</span>
          }
        </span>
      </>
    )
  }

  // TODO: needs a debounce
  const handleInputFilterBlur = (evt) => {
    setValue(evt.target.value)
    setIsFilterActive(true)
  }

  const handleClear = (event) => {
    event.stopPropagation();

    setValue('');
    setIsFilterActive(false);
    setPopoverOpen(false);

    // reset to default option
    setOperator(defaultOperator(operators));
    setOperatorOnly(operators[defaultOperator(operators)]?.operatorOnly ?? false);

    onFilterClear(fieldName);
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div><FilterButton
          isFilterActive={isFilterActive}
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

            {!operatorOnly && <Input
              placeholder="description..."
              autoFocus
              onChange={handleInputFilterBlur}
              // onChange = { (e) => {setValue(e.target.value)} }
              value={value}
              className="h-8 w-[150px] lg:w-[250px] pr-6"
            />}
          </div>
        </div>
      </PopoverContent>
    </Popover >
  )
}

export default DescriptionFilter;
