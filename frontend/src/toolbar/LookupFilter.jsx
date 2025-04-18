import { Button } from "@/components/ui/button.jsx"
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { ReactSelect } from '@/components/ReactSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
import { defaultOperator, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useSearch } from "@/components/search/SearchContext.jsx"

function LookupFilter({label, field, Icon, options, operators, coloredPills}) {

  const searchContext = useSearch();
  const activeFilters = searchContext.getFilters(field);
  const isFilterActive = activeFilters.length > 0;
  // Initialize state based on context during initial render
  const [selectedOptions, setSelectedOptions] = useState(activeFilters.length > 0 ? activeFilters[0].value : []);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(activeFilters.length > 0 ? activeFilters[0].operatorDefinition.id : defaultOperator(operators));
  const operatorDef = operators[operator];
  const selectOptions = options instanceof Function ? options() : options;

  // handle when a SINGLE selection is made while the IS operator is active
  // when this happens we should close the filter popover and update the filter immediately
  useEffect(() => {
    if (operator !== 'lookup_is' || selectedOptions.length === 0) return;

    setPopoverOpen(false);
    searchContext.updateFilters(filterExpression(field, operatorDef, selectedOptions));
  }, [selectedOptions, operator, field, operatorDef, searchContext]); // Added dependencies for exhaustive-deps

  useEffect(() => {
    // handle operator definitions that don't have a "value" per se
    // e.g. blank / empty
    const currentOperatorDef = operators[operator]; // Get current def based on state
    if (currentOperatorDef && 'operatorOnly' in currentOperatorDef) {
        setPopoverOpen(false);
        // Check if filter already exists to avoid loops
        const existingFilter = searchContext.getFilters(field).find(f => f.operatorDefinition.id === operator);
        if (!existingFilter) {
           searchContext.updateFilters(filterExpression(field, currentOperatorDef, []));
        }
    }

    // handle switching from multi to single select when multiple options are still selected
    // the selection options are cleared in this case
    if (operator === 'lookup_is' && selectedOptions.length > 1) {
      setSelectedOptions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator, field, searchContext]); // Removed operators, selectedOptions to avoid potential loops

  // When using react-select we need to listen to and capture the Escape.
  useEffect(() => {
    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            setPopoverOpen(false);
        }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []); // Removed popoverOpen dependency - listener should always be active

  const saveSelection = () => {
    setPopoverOpen(false);
    const currentOperatorDef = operators[operator]; // Get current def
    if (currentOperatorDef) {
        searchContext.updateFilters(filterExpression(field, currentOperatorDef, selectedOptions));
    } else {
        console.error(`[LookupFilter ${field}] Cannot save selection, operator definition not found for operator: ${operator}`);
    }
  }

  const clearSelection = (event) => {
    event.stopPropagation();
    setOperator(defaultOperator(operators));
    setSelectedOptions([]);
    setPopoverOpen(false);
    searchContext.clearFilters(field);
  };

  function renderButtonLabel(label) {
    const currentOperatorDef = operators[operator]; // Use current operator state
    if (!currentOperatorDef) {
        // Handle case where operator definition might not be found initially
        return <span>{label}</span>;
    }
    return (
      <>
        <span>
          <Icon className="h-4 w-4 mr-2"/>
        </span>
        <span className="inline-flex gap-1 w-auto text-nowrap">
          <span className="opacity-40">{label}</span>

          {'short' in currentOperatorDef && currentOperatorDef.short ?
            <span>{currentOperatorDef.short}</span>
            :
            <span>{currentOperatorDef.label}</span>
          }

          {['lookup_is', 'lookup_any_of', 'lookup_not_any_of'].includes(operator) && selectedOptions.length > 0 &&
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black bg-opacity-60 dark:bg-opacity-30">
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
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operators).map(([value, obj]) => (
                  <SelectItem key={value} value={value}>{obj.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Display the Clear | Filter buttons */}
            {['lookup_any_of', 'lookup_not_any_of'].includes(operator) && (
              <>
                <Button size="sm" className="ml-auto justify-end" variant="ghost"
                        onClick={clearSelection}>Clear</Button>
                <Button size="sm" className="justify-end" disabled={selectedOptions.length === 0}
                        onClick={saveSelection}>Filter</Button>
              </>
            )}
          </div>

          {!(operators[operator] && 'operatorOnly' in operators[operator]) && selectOptions &&
            <ReactSelect
              onChange={selected => setSelectedOptions(Array.isArray(selected) ? [...selected] : [selected])}
              optionsAsArray={selectOptions}
              valueAsArray={selectedOptions}
              isMulti={operator !== 'lookup_is'} // Corrected comparison: lookup_is is single
              isClearable={false}
              closeMenuOnSelect={operator === 'lookup_is'} // Close only for single select mode
              coloredPills={coloredPills}
              autoFocus
              menuIsOpen={popoverOpen} // Control menu visibility via popover state
              // defaultMenuIsOpen // Avoid using this if controlling via state
              components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
            />
          }
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default LookupFilter; 