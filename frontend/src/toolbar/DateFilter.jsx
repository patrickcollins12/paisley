import { useState } from "react";
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



// TODO: ON OPERATOR CHANGE
// - update operator AND
// - set date to now

export default function DateFilter({operators}) {

  const fieldName = 'datetime_without_timezone';
  const searchContext = useSearch();
  const activeFilters = searchContext.getFilters(fieldName);

  const [value, setValue] = useState(() => {
    if (activeFilters.length === 0) return null;

    if (activeFilters.length > 1) {
      const fromFilter = activeFilters.find(f => f.operatorDefinition.id === 'date_after');
      const toFilter = activeFilters.find(f => f.operatorDefinition.id === 'date_before');
      return {
        from: DateTime.fromISO(fromFilter.operatorDefinition.getValue?.(fromFilter) ?? fromFilter.value),
        to: DateTime.fromISO(toFilter.operatorDefinition.getValue?.(toFilter) ?? toFilter.value)
      };
    }

    const dateValue = DateTime.fromISO(activeFilters[0].value);
    return {
      from: activeFilters[0].operatorDefinition.id === 'date_after' ? dateValue : null,
      to: activeFilters[0].operatorDefinition.id === 'date_before' ? dateValue : null
    };
  });
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    if (activeFilters.length === 0) return '';

    const expression = activeFilters[0];
    const namedRangeIndex = expression.value.toString().indexOf(namedDateRangePrefix);
    if (namedRangeIndex === -1) return '';

    const namedRangeName = expression.value.toString().substring(namedRangeIndex + namedDateRangePrefix.length);
    const namedRange = namedDateRanges.find(x => x.id === namedRangeName);
    if (!namedRange) return '';

    return namedRange.label;
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(() => {
    // if there are no active filters or too many then return the default operator
    if (activeFilters.length === 0 || activeFilters.length > 2) return defaultOperator(operators);

    // if there is one then set the operator to that
    if (activeFilters.length === 1) return activeFilters[0].operatorDefinition.id;

    // if there is two then set the operator to between
    return operators.date_between.id;
  });
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
