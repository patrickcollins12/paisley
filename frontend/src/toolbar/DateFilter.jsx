"use client";
import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FilterButton from "./FilterButton.jsx"
import { dateOperators, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useSearch } from "@/components/search/SearchContext.jsx"

export default function DateFilter({ className }) {

  const fieldName = 'datetime_without_timezone';
  const searchContext = useSearch();
  const [date, setDate] = useState();
  const [pickerMode, setPickerMode] = useState("after");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const clearSelected = (event) => {
    event.stopPropagation();

    setDate(null);
    setSelectedPeriod("");
    setIsFilterActive(false);
    setPopoverOpen(false);

    searchContext.clearFilters(fieldName);
  };

  const handleSelectChange = (value) => {
    setPickerMode(value);
    const now = DateTime.now();
    if (value === "after") {
      setDate({from: now, to: null});
    } else if (value === "before") {
      setDate({from: null, to: now});
    } else {
      setDate({from: now.minus({days: 3}), to: now});
    }
    setSelectedPeriod("");
  };

  const filterPressed = () => {
    setPopoverOpen(false)
    setIsFilterActive(true)
    saveValues()
  }

  const saveValues = (filterValues) => {
    console.log(`Saved: pickerMode ${pickerMode}, date ${JSON.stringify(filterValues ? filterValues : date)}`);
    const dateRange = {
      ...date,
      ...filterValues
    };
    const filters = []
    if (dateRange?.from) {
      filters.push(filterExpression(fieldName, dateOperators.after, dateRange?.from.toISODate()));
    }
    if (dateRange?.to) {
      filters.push(filterExpression(fieldName, dateOperators.before, dateRange?.to.toISODate()));
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
    setSelectedPeriod("");
    setIsFilterActive(false)

    if (pickerMode === "after") {
      setDate({from: DateTime.fromJSDate(selectedDate), to: null});
    } else if (pickerMode === "before") {
      setDate({from: null, to: DateTime.fromJSDate(selectedDate)});
    } else {
      setDate({
        from: selectedDate?.from ? DateTime.fromJSDate(selectedDate.from) : null,
        to: selectedDate?.to ? DateTime.fromJSDate(selectedDate.to) : null,
      });
    }
  };

  const setRelativeDateRange = (period, periodName) => {
    const now = DateTime.now();
    let from, to;

    setPickerMode("between");

    switch (period) {
      case 'last7days':
        from = now.minus({days: 7});
        to = now;
        break;
      case 'last1month':
        from = now.minus({months: 1});
        to = now;
        break;
      case 'last3months':
        from = now.minus({months: 3});
        to = now;
        break;
      case 'last12months':
        from = now.minus({months: 12});
        to = now;
        break;
      case 'thisMonth':
        from = now.startOf('month');
        to = now;
        break;
      case 'thisYear':
        from = now.startOf('year');
        to = now;
        break;
      case 'lastWeek':
        from = now.minus({weeks: 1}).startOf('week');
        to = now.minus({weeks: 1}).endOf('week');
        break;
      case 'lastMonth':
        from = now.minus({months: 1}).startOf('month');
        to = now.minus({months: 1}).endOf('month');
        break;
      case 'lastQuarter':
        from = now.minus({quarters: 1}).startOf('quarter');
        to = now.minus({quarters: 1}).endOf('quarter');
        break;
      case 'lastYear':
        from = now.minus({years: 1}).startOf('year');
        to = now.minus({years: 1}).endOf('year');
        break;
      default:
        console.log("PANIC: food fight!")
        from = null;
        to = null;
    }

    setIsFilterActive(true)
    setSelectedPeriod(periodName);
    setPopoverOpen(false)
    setDate({from, to});
    saveValues({from, to})
  };


  const renderButtonLabel = (label) => {
    const calIcon = (<CalendarIcon className="h-4 w-4 mr-2"/>);

    if (!isFilterActive) {
      return (
        <span>{label}</span>
      );
    } else {
      if (selectedPeriod) {
        return (
          <>{calIcon}<span>{selectedPeriod}</span></>
        );
      }
      if (!date?.from && !date?.to) {
        return (
          <span>{label}</span>
        );
      }
      if (date?.from && date?.to) {
        return (
          <> {calIcon} {formatTwoDates(date.from, date.to)} </>
        );
      }
      if (date?.from) {
        return (
          <> {calIcon} &gt;&nbsp; {formatDate(date.from)}</>
        );
      }
      if (date?.to) {
        return (
          <> {calIcon} &lt;&nbsp; {formatDate(date.to)} </>
        );
      }
    }
  };

  const dateRangeClasses = "px-2 py-0 h-7 m-0 hover:bg-slate-100 dark:hover:bg-slate-900 justify-start";

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {/* {renderButtonShell("Date")} */}
          <div>
            <FilterButton
              isFilterActive={isFilterActive}
              label="Date"
              onClear={clearSelected}
              activeRenderer={renderButtonLabel}
            />
          </div>


        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">

          <Select value={pickerMode} onValueChange={handleSelectChange}>
            <SelectTrigger className="border-0 p-1 text-xs w-auto inline-flex">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="after">On or after</SelectItem>
              <SelectItem value="before">On or before</SelectItem>
              <SelectItem value="between">Between</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-row gap-3">
            <div>
              <Calendar
                className="px-0"
                initialFocus
                mode={pickerMode === "between" ? "range" : "single"}
                defaultMonth={date?.from?.toJSDate()}
                selected={
                  pickerMode === "between"
                    ? {from: date?.from?.toJSDate(), to: date?.to?.toJSDate()}
                    : pickerMode === "after"
                      ? date?.from?.toJSDate()
                      : date?.to?.toJSDate()
                }
                onSelect={handleDateSelect}
                numberOfMonths={1}
              />
              <div className="flex flex-row gap-3 justify-end">
                <Button size="sm" variant="secondary" onClick={clearSelected}>Clear</Button>
                <Button size="sm" onClick={filterPressed}>Select</Button>
              </div>

            </div>
            <div className="flex flex-col mx-3 gap-0">
              <Button size="sm" variant={selectedPeriod === 'Last 7 days' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('last7days', 'Last 7 days')}>Last
                7 days</Button>
              <Button size="sm" variant={selectedPeriod === 'Last 1 month' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('last1month', 'Last 1 month')}>Last
                1 month</Button>
              <Button size="sm" variant={selectedPeriod === 'Last 3 months' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('last3months', 'Last 3 months')}>Last
                3 months</Button>
              <Button size="sm" variant={selectedPeriod === 'Last 12 months' ? "selected" : "ghost"}
                      className={dateRangeClasses}
                      onClick={() => setRelativeDateRange('last12months', 'Last 12 months')}>Last 12 months</Button>
              <div className="h-2"></div>

              <Button size="sm" variant={selectedPeriod === 'This month' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('thisMonth', 'This month')}>This
                month</Button>
              <Button size="sm" variant={selectedPeriod === 'This year' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('thisYear', 'This year')}>This
                year</Button>
              <div className="h-2"></div>

              <Button size="sm" variant={selectedPeriod === 'Last week' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('lastWeek', 'Last week')}>Last
                week</Button>
              <Button size="sm" variant={selectedPeriod === 'Last month' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('lastMonth', 'Last month')}>Last
                month</Button>
              <Button size="sm" variant={selectedPeriod === 'Last quarter' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('lastQuarter', 'Last quarter')}>Last
                quarter</Button>
              <Button size="sm" variant={selectedPeriod === 'Last year' ? "selected" : "ghost"}
                      className={dateRangeClasses} onClick={() => setRelativeDateRange('lastYear', 'Last year')}>Last
                year</Button>
            </div>

          </div>

        </PopoverContent>
      </Popover>
    </div>
  );
}
