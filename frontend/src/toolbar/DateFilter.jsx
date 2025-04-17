import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FilterButton from "./FilterButton.jsx"
import {
  defaultOperator,
  filterExpression,
  namedDateRangePrefix,
  namedDateRanges
} from "@/toolbar/FilterExpression.jsx"
import { useSearch } from "@/components/search/SearchContext.jsx"

// Helper function to parse active date filters from context
const parseActiveDateFilters = (activeFilters, operators) => {
  let fromFilter = activeFilters.find(f => f.operatorDefinition.id === operators.date_after.id);
  let toFilter = activeFilters.find(f => f.operatorDefinition.id === operators.date_before.id);
  let operatorId = defaultOperator(operators);
  let value = { from: null, to: null };
  let selectedPeriodLabel = '';
  let isNamedRange = false;

  // Check for named range (will have both from and to filters with special prefix)
  if (fromFilter?.value?.startsWith(namedDateRangePrefix) && toFilter?.value?.startsWith(namedDateRangePrefix)) {
      const fromRangeName = fromFilter.value.substring(namedDateRangePrefix.length);
      const toRangeName = toFilter.value.substring(namedDateRangePrefix.length);
      
      if (fromRangeName === toRangeName) {
          const namedRange = namedDateRanges.find(r => r.id === fromRangeName);
          if (namedRange && namedRange.getDateRange) {
              value = namedRange.getDateRange(); // Get actual DateTime objects
              selectedPeriodLabel = namedRange.label;
              operatorId = operators.date_between.id; // Named ranges imply 'between'
              isNamedRange = true;
          } else {
               console.warn(`DateFilter: Could not find named range definition for ID: ${fromRangeName}`);
               // Reset filters if named range is invalid
               fromFilter = null; 
               toFilter = null;
          }
      } else {
          console.warn(`DateFilter: Mismatched named range IDs: ${fromRangeName} vs ${toRangeName}`);
           // Reset filters if named range is invalid
          fromFilter = null;
          toFilter = null;
      }
  }
  
  // If not a named range, process explicit dates
  if (!isNamedRange) {
      if (fromFilter?.value) {
          try {
              value.from = DateTime.fromISO(fromFilter.value);
              if (!value.from.isValid) throw new Error('Invalid From Date');
          } catch (e) {
              console.warn(`DateFilter: Could not parse 'from' date ISO string: ${fromFilter.value}`, e);
              value.from = null;
              fromFilter = null; // Invalidate filter
          }
      }
      if (toFilter?.value) {
          try {
              value.to = DateTime.fromISO(toFilter.value);
              if (!value.to.isValid) throw new Error('Invalid To Date');
          } catch(e) {
              console.warn(`DateFilter: Could not parse 'to' date ISO string: ${toFilter.value}`, e);
              value.to = null;
              toFilter = null; // Invalidate filter
          }
      }

      // Determine operator based on successfully parsed filters
      if (value.from && value.to) {
          operatorId = operators.date_between.id;
      } else if (value.from) {
          operatorId = operators.date_after.id;
      } else if (value.to) {
          operatorId = operators.date_before.id;
      } else {
          // If neither date is valid, reset to default
          operatorId = defaultOperator(operators);
          value = { from: null, to: null }; // Ensure value is reset
      }
  }

  return { operatorId, value, selectedPeriodLabel };
};

export default function DateFilter({operators}) {

  const fieldName = 'datetime_without_timezone';
  const searchContext = useSearch();

  const [value, setValue] = useState(null); // <-- Simplified
  const [selectedPeriod, setSelectedPeriod] = useState(''); // <-- Simplified
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(() => defaultOperator(operators)); // <-- Simplified (keeps default)

  // Effect to hydrate state from context
  useEffect(() => {
    // console.log('[DateFilter Effect] Running. Context Filters:', searchContext.filters);
    const activeFilters = searchContext.getFilters(fieldName);
    // console.log(`[DateFilter Effect] Active filters for ${fieldName}:`, activeFilters);

    if (activeFilters.length === 0) {
      // No active filters for this field, reset state
      // console.log('[DateFilter Effect] No active filters found. Resetting state.');
      const defaultOp = defaultOperator(operators);
      if (operator !== defaultOp) {
        // console.log(`[DateFilter Effect] Resetting operator to default: ${defaultOp}`);
        setOperator(defaultOp);
      }
      if (value !== null) {
        // console.log('[DateFilter Effect] Resetting value to null.');
        setValue(null);
      }
      if (selectedPeriod !== '') {
        // console.log('[DateFilter Effect] Resetting selectedPeriod to empty.');
        setSelectedPeriod('');
      }
      return;
    }

    // Parse the active filters using the reusable helper function
    // console.log('[DateFilter Effect] Parsing active filters...');
    const { 
        operatorId: newOperatorId, 
        value: newValue, 
        selectedPeriodLabel: newSelectedPeriod 
    } = parseActiveDateFilters(activeFilters, operators);
    // console.log('[DateFilter Effect] Parsed state:', { newOperatorId, newValue, newSelectedPeriod });

    // Original update logic (restored)
    // Update state only if values have actually changed to avoid infinite loops
    let stateChanged = false;
    if (newOperatorId !== operator) {
      // console.log(`[DateFilter Effect] Operator changed: ${operator} -> ${newOperatorId}`);
      setOperator(newOperatorId);
      stateChanged = true;
    }
    
    // Compare ISO strings for dates to avoid issues with object identity / milliseconds
    const oldFromISO = value?.from?.toISO();
    const newFromISO = newValue?.from?.toISO();
    const oldToISO = value?.to?.toISO();
    const newToISO = newValue?.to?.toISO();

    if (newFromISO !== oldFromISO || newToISO !== oldToISO) { 
      // console.log(`[DateFilter Effect] Value changed: FROM ${oldFromISO} -> ${newFromISO}, TO ${oldToISO} -> ${newToISO}`);
      // Note: Setting the same Luxon object reference is fine if it hasn't changed
      setValue(newValue); 
      stateChanged = true;
    }
    
    if (newSelectedPeriod !== selectedPeriod) {
      // console.log(`[DateFilter Effect] SelectedPeriod changed: ${selectedPeriod} -> ${newSelectedPeriod}`);
      setSelectedPeriod(newSelectedPeriod);
      stateChanged = true;
    }

    // if (!stateChanged) {
        // console.log('[DateFilter Effect] No state changes detected.');
    // }
    

  }, [searchContext.filters, operators, fieldName]); // <-- This dependency should now work correctly

  const operatorDef = operators[operator];

  const handleClear = (event) => {
    event.stopPropagation();

    setValue(null);
    setSelectedPeriod('');
    setPopoverOpen(false);

    searchContext.clearFilters(fieldName);
  };

  const handleSelectClick = () => {
    setPopoverOpen(false);
    updateFilters(value);
  }

  const updateFilters = (dateRange, rangeName = null) => {
    // console.log('DateFilter.updateFilters', dateRange, rangeName, operatorDef);

    const filters = []
    if (dateRange?.from) {
      const fromValue = rangeName ? `${namedDateRangePrefix}${rangeName}` : dateRange?.from.toISODate();
      filters.push(filterExpression(
        fieldName,
        operators.date_after,
        fromValue
      ));
    }
    if (dateRange?.to) {
      const toValue = rangeName ? `${namedDateRangePrefix}${rangeName}` : dateRange?.to.toISODate();
      filters.push(filterExpression(
        fieldName,
        operators.date_before,
        toValue
      ));
    }

    searchContext.updateFilters(...filters);
  }

  const formatDate = (date) => {
    return date.year === DateTime.now().year ? date.toFormat("LLL dd") : date.toFormat("LLL dd, yyyy");
  };

  const formatTwoDates = (date1, date2) => {
    const thisYear = DateTime.now().year;
    if (date1.year === thisYear && date2.year === thisYear) {
      return date1.toFormat("LLL dd") + " - " + date2.toFormat("LLL dd");
    } else {
      return date1.toFormat("LLL dd, yyyy") + " - " + date2.toFormat("LLL dd, yyyy");
    }
  };

  const handleDateSelect = (selectedDate) => {
    setSelectedPeriod('');
    
    if (operator === 'date_after') {
      setValue({from: DateTime.fromJSDate(selectedDate), to: null});
    }
    else if (operator === 'date_before') {
      setValue({from: null, to: DateTime.fromJSDate(selectedDate)});
    }
    else if (operator === 'date_between') {
      setValue({
        from: selectedDate?.from ? DateTime.fromJSDate(selectedDate.from) : null,
        to: selectedDate?.to ? DateTime.fromJSDate(selectedDate.to) : null,
      });
    }
  };

  const handleRangeClick = (rangeId) => {
    const range = namedDateRanges.find(r => r.id === rangeId);
    if (!range) return;

    if (range?.getDateRange === undefined) {
      console.error(`DateFilter.handleRangeClick: No date range function defined for range id '${rangeId}'`);
      return;
    }

    setPopoverOpen(false);
    setSelectedPeriod(range.label);
    setOperator(operators.date_between.id);
    setValue(range.getDateRange());
    updateFilters(range.getDateRange(), rangeId);
  }

  const renderButtonLabel = (label) => {
    const calIcon = (<CalendarIcon className="h-4 w-4 mr-2"/>);

    if (!searchContext.isFilterActive(fieldName)) {
      return (
        <span>{label}</span>
      );
    } else {
      if (selectedPeriod) {
        return (
          <>{calIcon}<span>{selectedPeriod}</span></>
        );
      }
      if (!value?.from && !value?.to) {
        return (
          <span>{label}</span>
        );
      }
      if (value?.from && value?.to) {
        return (
          <> {calIcon} {formatTwoDates(value.from, value.to)} </>
        );
      }
      if (value?.from) {
        return (
          <> {calIcon} &gt;&nbsp; {formatDate(value.from)}</>
        );
      }
      if (value?.to) {
        return (
          <> {calIcon} &lt;&nbsp; {formatDate(value.to)} </>
        );
      }
    }
  };

  return (
    <div className="grid gap-2">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {/* {renderButtonShell("Date")} */}
          <div>
            <FilterButton
              isFilterActive={searchContext.isFilterActive(fieldName)}
              label="Date"
              onClear={handleClear}
              activeRenderer={renderButtonLabel}
            />
          </div>


        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <Select value={operator} className="border border-3"
                  onValueChange={operatorValue => setOperator(operatorValue)}>
            <SelectTrigger className="border-0 p-1 text-xs w-auto inline-flex">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(operators).map(([value, obj]) => (
                <SelectItem key={value} value={value}>{obj.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-row gap-3">
            <div>
              <Calendar
                className="px-0"
                initialFocus
                mode={operator === "date_between" ? "range" : "single"}
                defaultMonth={value?.from?.toJSDate()}
                selected={
                  operator === "date_between"
                    ? {from: value?.from?.toJSDate(), to: value?.to?.toJSDate()}
                    : operator === "date_after"
                      ? value?.from?.toJSDate()
                      : value?.to?.toJSDate()
                }
                onSelect={handleDateSelect}
                numberOfMonths={1}
              />
              <div className="flex flex-row gap-3 justify-end">
                <Button size="sm" variant="secondary" onClick={handleClear}>Clear</Button>
                <Button size="sm" onClick={handleSelectClick}>Select</Button>
              </div>

            </div>
            <div className="flex flex-col mx-3">
              {namedDateRanges.map((range, index) => (
                <div key={range.id}>
                  {/* insert a gap between groups */}
                  {((namedDateRanges[index - 1]?.group ?? 1) !== range.group) &&
                    <div className="h-2"></div>
                  }
                  <Button
                    size="sm"
                    variant="ghost" // TODO: Implemented "selected" class
                    className="px-2 py-0 h-7 m-0 hover:bg-slate-100 dark:hover:bg-slate-900 justify-start"
                    onClick={() => handleRangeClick(range.id)}>
                    {range.label}
                  </Button>
                </div>
              ))}
            </div>

          </div>

        </PopoverContent>
      </Popover>
    </div>
  );
}
