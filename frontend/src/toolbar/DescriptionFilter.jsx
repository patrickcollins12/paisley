import { NotepadText as DescriptionIcon } from "lucide-react"
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
import useDebounce from './useDebounce.jsx'; // Adjust the import path as necessary

// import FilterButton from './FilterButton'; // Adjust the path as necessary

function DescriptionFilter({ dataTable, operators, onFilterUpdate }) {

  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 700);

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("contains");

  useEffect(() => {
    // Perform any action using the debounced value
    // This will be triggered only after the specified delay (500ms in this example)
    console.log('Debounced value:', debouncedValue);

    onFilterUpdate({
      field: 'description',
      operator: '=',
      value: debouncedValue
    });
  }, [debouncedValue]);
  
  
  function renderButtonLabel(label) {
    const icon = (<DescriptionIcon className="h-4 w-4 mr-2" />);
    const selectedItem = operators[pickerMode];
    const ch = selectedItem.surround
    const sh = selectedItem.short

    if (pickerMode.startsWith("is")) {
      return (
        <span className="inline-flex w-auto text-nowrap">
        {icon}
          <span className="opacity-40">{label}&nbsp;</span>
          {selectedItem?.short}
        </span>
      );
    }

    else {
      return (
        <>
          <span>{icon}</span>
          <span className="inline-flex gap-1 w-auto text-nowrap">
            <span className="opacity-40">{label}</span>
            {ch ? (
              <span>{ch}{debouncedValue}{ch}</span>
            ) : (
              <>
                {sh && <span>{sh}</span>}
                <span>{debouncedValue}</span>
              </>
            )}
          </span>
        </>
      );
    }
  }

  // when pickerMode changes from the top options
  useEffect(() => {
    if (pickerMode === "isblank" || pickerMode === "isnotblank" || pickerMode === "isedited") {
      setIsFilterActive(true)
      setPopoverOpen(false)
      saveValues({ field: "account", op: pickerMode, val: null })
    }
    if (pickerMode === "isanyof" || pickerMode === "isnotanyof") {
      setIsFilterActive(false)
    }
    if (pickerMode === "is") {
      if (optionCount > 1) {
        _clearValues()
        // setIsFilterActive(false)
      }
    }

  }, [pickerMode]);


  // When using react-select we need to listen to and capture the Escape.
  useEffect(() => {
    const handleEscape = (event) => event.key === 'Escape' && setPopoverOpen(false);
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [popoverOpen]);


  const saveValues = (source) => {
    console.log(`Saving from ${source}`)
    // : isFilterActive: ${isFilterActive}, pickerMode: \"${pickerMode}\", selectedOptions: ${JSON.stringify(_retrieveSelectedValues())}`)
  }


  // TODO: needs a debounce
  const handleInputFilterBlur = (evt) => {
    setValue(evt.target.value)
    setIsFilterActive(true)
  }

  const _clearValues = () => {
    setSelectedOptions([]);
    setOptionCount(0)
  }

  const clearSelected = (e) => {
    _clearValues()
    setIsFilterActive(false)
    setPopoverOpen(false)
    // saveValues("cleared")
    saveValues({ "field": "account", "op": "clear", "val": null })

    e.stopPropagation();
  };

  const saveSelections = () => {
    setIsFilterActive(optionCount > 0 ? true : false)
    setPopoverOpen(false)
    saveValues(`From multi-select filter`)
  }

  // When changing between modes
  const handlePickerModeChange = (value) => {
    setPickerMode(value)

  }



  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div><FilterButton
          isFilterActive={isFilterActive}
          label="Description"
          onClear={clearSelected}
          activeRenderer={renderButtonLabel}
        /></div>

      </PopoverTrigger>
      <PopoverContent align='start' className="w-auto">
        <div className="text-xs">
          <div className="flex flex-col gap-3 items-start mb-3">
            <Select value={pickerMode} className="border border-3" onValueChange={handlePickerModeChange}>
              <SelectTrigger className="border h-8 text-xs w-[150px] inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>

                {Object.entries(operators).map(([value, obj]) => (
                  <SelectItem key={value} value={value}>{obj.label}</SelectItem>
                ))}

              </SelectContent>
            </Select>

            <Input
              placeholder="description..."
              autoFocus
              onChange={handleInputFilterBlur}
              // onChange = { (e) => {setValue(e.target.value)} }
              value={value}
              className="h-8 w-[150px] lg:w-[250px] pr-6"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover >
  )
}

export default DescriptionFilter;
