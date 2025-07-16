import { X } from "lucide-react"
import { Input } from "@/components/ui/input.jsx"
import { useTranslation } from 'react-i18next';
import React from 'react';

const SearchInput = React.forwardRef(({ 
  value, 
  onChange, 
  onClear,
  onSubmit,
  placeholder, 
  className = "h-8 w-[150px] lg:w-[250px] pr-6",
  showClearButton = true,
  clearThreshold = 1,
  ...props 
}, ref) => {
  const { t } = useTranslation();

  function handleClear() {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } });
    }
  }

  function handleKeyDown(evt) {
    if (evt.key === "Escape") {
      handleClear();
      evt.preventDefault(); // Prevents default Escape behavior (e.g., closing modal if inside one)
    } else if (evt.key === "Enter" && onSubmit) {
      onSubmit();
      evt.preventDefault(); // Prevents form submission if inside a form
    }
  }

  return (
    <div className="relative block">
      {showClearButton && value.length > clearThreshold && ( // Show X only if value has more than clearThreshold characters
        <button
          className="absolute top-1/2 transform -translate-y-1/2 right-2 z-10"
          onClick={handleClear} // Clear input on click
          aria-label={t("Clear input")}
        >
          <X size={16} className="text-slate-400 hover:text-black dark:hover:text-white" />
        </button>
      )}

      <Input
        ref={ref}
        placeholder={placeholder || t("Search...")}
        onChange={onChange}
        onKeyDown={handleKeyDown} // Listen for Escape key
        value={value}
        className={className}
        {...props}
      />
    </div>
  )
});

SearchInput.displayName = "SearchInput";

export default SearchInput; 