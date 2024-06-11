import { NotepadText as DescriptionIcon } from "lucide-react"
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useDebounce from './useDebounce.jsx';
import { defaultOperator, filterExpression } from "@/toolbar/RuleCreator.jsx"
import { useUpdateEffect } from "react-use"
import { FilterButtonAlt, FilterButtonAltContent, FilterButtonAltLabel } from "@/toolbar/FilterButtonAlt.jsx" // Adjust the import path as necessary

// import FilterButton from './FilterButton'; // Adjust the path as necessary

function DescriptionFilterAlt({operators, onFilterUpdate, onFilterClear}) {

  const fieldName = 'description';
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 7);

  const [isActive, setIsActive] = useState(false);
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
  useEffect(() => {
    // check whether the operator that has been selected is "operatorOnly"
    // this essentially means the user does not need to select a value
    if (operatorDef?.operatorOnly) {
      setValue('');
      setIsFilterActive(true);
      setIsActive(true);
      setPopoverOpen(false);
      setOperatorOnly(true);

      onFilterUpdate(filterExpression(fieldName, operatorDef, null));
    } else {
      setOperatorOnly(false);

      onFilterUpdate(filterExpression(fieldName, operatorDef, debouncedValue));
    }
  }, [operator]);

  // TODO: needs a debounce
  const handleInputFilterBlur = (evt) => {
    setValue(evt.target.value)
    setIsFilterActive(true);
    setIsActive(true);
  }

  const handleClear = (event) => {
    event.stopPropagation();

    setValue('');
    setIsFilterActive(false);
    setIsActive(false);
    setPopoverOpen(false);

    // reset to default option
    setOperator(defaultOperator(operators));
    setOperatorOnly(operators[defaultOperator(operators)]?.operatorOnly ?? false);

    onFilterClear(fieldName);
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <FilterButtonAlt active={isActive} onClear={handleClear}>
      <FilterButtonAltLabel>
        {
          !isActive ?
            "Description"
            :
            <>
              <DescriptionIcon className="h-4 w-4 mr-2"/>
              <span className="inline-flex gap-1 w-auto text-nowrap">
                <span className="opacity-40">Description</span>

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
        }
      </FilterButtonAltLabel>
      <FilterButtonAltContent>
        <div className="text-xs">
          <div className="flex flex-col gap-3 items-start mb-3">
            <Select value={operator} className="border border-3"
                    onValueChange={operatorValue => setOperator(operatorValue)}>
              <SelectTrigger className="border h-8 text-xs w-[200px] inline-flex">
                <SelectValue/>
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
      </FilterButtonAltContent>
    </FilterButtonAlt>
  )
}

export default DescriptionFilterAlt;
