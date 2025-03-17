import { X } from "lucide-react"
import { Input } from "@/components/ui/input.jsx"
import { useState } from "react"

export default function GlobalFilter({ dataTable }) {
  const [value, setValue] = useState('');

  function handleChange(evt) {
    setValue(evt.target.value);
    dataTable.setGlobalFilter(evt.target.value);
  }

  function clearInput() {
    setValue('');
    dataTable.resetGlobalFilter();
  }

  function handleKeyDown(evt) {
    if (evt.key === "Escape") {
      clearInput();
      evt.preventDefault(); // Prevents default Escape behavior (e.g., closing modal if inside one)
    }
  }

  return (
    <div className="relative block">
      {value.length > 1 && ( // Show X only if inputValue has more than one character
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
        onKeyDown={handleKeyDown} // Listen for Escape key
        value={value}
        className="h-8 w-[150px] lg:w-[250px] pr-6"
      />
    </div>
  )
}