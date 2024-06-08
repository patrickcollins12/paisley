import { Input } from "@/components/ui/input.jsx"
import { X } from "lucide-react"
import React, { useState } from 'react';

function AllFilter({ dataTable }) {
  const defaultInputValue = dataTable.getColumn('description').getFilterValue() ?? ''
  const [inputValue, setInputValue] = useState(defaultInputValue);

  const handleChange = (evt) => {
    const value = evt.target.value;
    dataTable.getColumn('description').setFilterValue(value);
    setInputValue(value);
    dataTable.resetPageIndex();
  };

  const clearInput = () => {
    dataTable.getColumn('description').setFilterValue('');
    setInputValue('');
    dataTable.resetPageIndex();
  };

  return (
    <div className="relative block">
      {inputValue.length > 1 && ( // Show X only if inputValue has more than one character
        <button
          className="absolute top-1/2 transform -translate-y-1/2 right-2"
          onClick={clearInput} // Clear input on click
          aria-label="Clear input"
        >
          <X size={16} className="text-slate-400 hover:text-black dark:hover:text-white" />
        </button>
      )}

      <Input
        placeholder="Filter..."
        onChange={handleChange}
        value={inputValue}
        className="h-8 w-[150px] lg:w-[250px] pr-6"
      />
    </div>
  );
}

export default AllFilter;
