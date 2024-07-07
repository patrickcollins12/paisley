import { Landmark } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import React, { useState, useEffect, useMemo } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"

import { ReactSelect } from '@/components/ReactSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
import { defaultOperator, filterExpression } from "@/toolbar/RuleCreator.jsx"

function LookupFilter({ label, field, options, operators, onFilterUpdate, onFilterClear }) {

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(defaultOperator(operators));
  const [operatorOnly, setOperatorOnly] = useState(operators[defaultOperator(operators)]?.operatorOnly ?? false);
  const operatorDef = operators[operator];
  const selectOptions = options instanceof Function ? options() : options;

  // handle when a SINGLE selection is made while the IS operator is active
  // when this happens we should close the filter popover and update the filter immediately
  useEffect(() => {
    if (operator !== 'is' || selectedOptions.length === 0) return;

    setIsFilterActive(true);
    setPopoverOpen(false);

    onFilterUpdate(filterExpression(field, operatorDef, selectedOptions.map(option => option.value)));
  }, [selectedOptions]);

  useEffect(() => {
    // handle operator definitions that don't have a "value" per se
    // e.g. blank / empty
    if (operatorDef?.operatorOnly) {
      setIsFilterActive(true);
      setPopoverOpen(false);
      setOperatorOnly(true);

      onFilterUpdate(filterExpression(field, operatorDef, null));
    } else {
      setOperatorOnly(false);
    }

    // handle switching from multi to single select when multiple options are still selected
    // the selection options are cleared in this case
    if (operator === 'is' && selectedOptions.length > 1) {
      setSelectedOptions([]);
      setIsFilterActive(false);
    }
  }, [operator]);

  // When using react-select we need to listen to and capture the Escape.
  useEffect(() => {
    const handleEscape = (event) => event.key === 'Escape' && setPopoverOpen(false);
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [popoverOpen]);

  const saveSelection = () => {
    setIsFilterActive(selectedOptions.length > 0);
    setPopoverOpen(false);
    onFilterUpdate(filterExpression(field, operatorDef, selectedOptions.map(option => option.value)));
  }

  const clearSelection = (event) => {
    event.stopPropagation();

    setOperator(defaultOperator(operators));
    setSelectedOptions([]);
    setIsFilterActive(false);
    setPopoverOpen(false);

    onFilterClear(field);
  };

  function renderButtonLabel(label) {
    const icon = (<Landmark className="h-4 w-4 mr-2" />);

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

          {['is', 'anyof', 'notanyof'].includes(operator) && selectedOptions.length > 0 &&
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black bg-opacity-60 dark:bg-opacity-30">
              {selectedOptions.length}
            </span>
          }
        </span>
      </>
    )
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div><FilterButton
          isFilterActive={isFilterActive}
          label={label}
          onClear={clearSelection}
          activeRenderer={renderButtonLabel}
        /></div>

      </PopoverTrigger>
      <PopoverContent align='start' className="w-[350px]">
        <div className="text-xs">
          <div className="flex flex-row gap-3 items-center mb-3">
            <Select value={operator} onValueChange={operatorValue => setOperator(operatorValue)}>
              <SelectTrigger className="border-0 h-6 text-xs w-auto inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operators).map(([value, obj]) => (
                  <SelectItem key={value} value={value}>{obj.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Display the Clear | Filter buttons */}
            {['anyof', 'notanyof'].includes(operator) && (
              <>
                <Button size="sm" className="ml-auto justify-end" variant="secondary" onClick={clearSelection}>Clear</Button>
                <Button size="sm" className="justify-end" disabled={selectedOptions.length === 0} onClick={saveSelection}>Filter</Button>
              </>
            )}
          </div>

          {!operatorOnly && options &&
            <ReactSelect
              onChange={selected => setSelectedOptions(Array.isArray(selected) ? [...selected] : [selected])}
              options={selectOptions}
              value={selectedOptions}
              isMulti={operator !== 'is'}
              isClearable={false}
              closeMenuOnSelect={false}
              autoFocus
              components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
              defaultMenuIsOpen
            />
          }
        </div>
      </PopoverContent>
    </Popover >
  )
}

export default LookupFilter;
