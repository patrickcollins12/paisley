import { Input } from "@/components/ui/input.jsx"
import { X } from "lucide-react"
import { useEffect, useState } from 'react';
import { filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useDebounce } from "react-use"

const operatorDef = {
  label: 'contains',
  operator: 'contains',
  short: ''
};

function AllFilter({ onFilterUpdate, onFilterClear }) {

  const fieldName = 'all';

  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState(inputValue);

  useDebounce(() => {
    setDebouncedValue(inputValue);
  }, 500, [inputValue]);

  useEffect(() => {
    // if the debounced value is empty then we need to reset the filter
    if (debouncedValue) {
      onFilterUpdate(filterExpression(
        fieldName,
        operatorDef,
        inputValue
      ));
    } else {
      onFilterClear(fieldName);
    }
  }, [debouncedValue]);

  const handleClear = () => {
    setInputValue('');
    setDebouncedValue('');
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.currentTarget.blur();
      handleClear()
    }
  }

  return (
    <div className="relative block">
      {inputValue.length > 1 && ( // Show X only if inputValue has more than one character
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
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={onKeyDown}
        value={inputValue}
        className="h-8 w-[150px] lg:w-[250px] pr-6"
      />
    </div>
  );
}

export default AllFilter;
