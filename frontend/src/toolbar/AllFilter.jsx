import { Input } from "@/components/ui/input.jsx"
import { X } from "lucide-react"
import { useEffect, useState } from 'react';
import { filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useDebounce } from "react-use"
import { useSearch } from "@/components/search/SearchContext.jsx"

function AllFilter({ operators }) {

  const fieldName = 'all';
  const searchContext = useSearch();
  const activeFilters = searchContext.getFilters(fieldName);
  const [value, setValue] = useState(activeFilters.length > 0 ? activeFilters[0].value : '');

  // TODO: Fix the debounce clear that happens when the app starts up
  const handleUpdate = () => {
    if (!value) {
      searchContext.clearFilters(fieldName);
      return;
    }

    searchContext.updateFilters(filterExpression(
      fieldName,
      operators.all_contains,
      value
    ));
  }

  useDebounce(handleUpdate, 500, [value]);

  const handleClear = () => {
    setValue('');
    searchContext.clearFilters(fieldName);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
    // if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.currentTarget.blur();
      handleClear()
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.currentTarget.blur();
    }
  }

  return (
    <div className="relative block">
      {value.length > 1 && ( // Show X only if inputValue has more than one character
        <button
          className="absolute top-1/2 transform -translate-y-1/2 right-2"
          onClick={handleClear} // Clear input on click
          aria-label="Clear input"
        >
          <X size={16} className="text-slate-400 hover:text-black dark:hover:text-white" />
        </button>
      )}

      <Input
        placeholder="Filter..."
        onKeyDown={onKeyDown}
        onChange={event => setValue(event.target.value)}
        value={value}
        className="h-8 w-[150px] lg:w-[250px] pr-6"
      />
    </div>
  );
}

export default AllFilter;
