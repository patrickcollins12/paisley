import { Landmark } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import React, { useState, useRef, useEffect } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"

import { ReactSelect } from '@/components/ReactSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FilterButton from "./FilterButton.jsx"
// import FilterButton from './FilterButton'; // Adjust the path as necessary

function AccountFilter({ dataTable }) {
  const { data, error, isLoading } = useAccountData()
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [optionCount, setOptionCount] = useState(0);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("is");
  const [transformedData, setTransformedData] = useState([]);

  // when pickerMode changes from the top options
  useEffect(() => {
    if (pickerMode === "isblank" || pickerMode === "isnotblank") {
      setIsFilterActive(true)
      setPopoverOpen(false)
      saveValues({field:"account", op: pickerMode, val:null })
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
    const vals = _retrieveSelectedValues()

    console.log(`Saving from ${source}`)
    // : isFilterActive: ${isFilterActive}, pickerMode: \"${pickerMode}\", selectedOptions: ${JSON.stringify(_retrieveSelectedValues())}`)
  }

  const handleReactSelectChange = (selected) => {

    setSelectedOptions(selected);
    const itemCount = Array.isArray(selected) ? selected?.length : 1
    setOptionCount(itemCount)

    // for a single select, close the popover once selected
    if (pickerMode === "is" && itemCount > 0) {
      setIsFilterActive(true)
      setPopoverOpen(false)
      saveValues({"field": "account","op":"in", "val":_retrieveSelectedValues(selected)})
    }

  };


  const _clearValues = () => {
    setSelectedOptions([]);
    setOptionCount(0)
  }

  const clearSelected = (e) => {
    _clearValues()
    setIsFilterActive(false)
    setPopoverOpen(false)
    // saveValues("cleared")
    saveValues({"field": "account","op":"clear", "val":null})

    e.stopPropagation();
  };

  const saveSelections = () => {
    setIsFilterActive(optionCount > 0 ? true : false)
    setPopoverOpen(false)
    saveValues(`From multi-select filter ${JSON.stringify(_retrieveSelectedValues())}`)
  }

  // When changing between modes
  const handlePickerModeChange = (value) => {
    setPickerMode(value)

  }

  useEffect(() => {
    if (data) {
      const transformed = Object.values(data).map(item => ({
        label: `${item.institution} ${item.name}`,
        value: item.accountid
      }));

      setTransformedData(transformed);
    }
  }, [data]);

  const _retrieveSelectedValues = (selected) => {
    const s = (selected) ? selected : selectedOptions
    if (Array.isArray(s)) {
      return s.map(obj => obj.value);
    } else {
      return [s?.value]
    }
  }

  function renderButtonLabel(label) {
    const icon = (<Landmark className="h-4 w-4 mr-2" />);

    if (pickerMode === "isblank") {
      return (<>{icon}<span className="opacity-40">Account&nbsp;</span>is blank </>)
    }
    else if (pickerMode === "isnotblank") {
      return (<>{icon}<span className="opacity-40">Account&nbsp;</span> is not blank</>)
    }
    else if ((pickerMode === "is" || pickerMode === "isanyof" || pickerMode === "isnotanyof") && optionCount) {
      return (
        <>
          {icon}
          <span className="opacity-40 pr-2">{label}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black bg-opacity-60 dark:bg-opacity-30">
            {optionCount}
          </span>
        </>
      )
    }
    else {
      // handle strings etc
    }
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div><FilterButton
          isFilterActive={isFilterActive}
          label="Account"
          onClear={clearSelected}
          activeRenderer={renderButtonLabel}
        /></div>

      </PopoverTrigger>
      <PopoverContent align='start' className="w-[350px]">
        <div className="text-xs">
          <div className="flex flex-row gap-3 items-center mb-3">
            <Select value={pickerMode} onValueChange={handlePickerModeChange}>
              <SelectTrigger className="border-0 h-6 text-xs w-auto inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="is">Is</SelectItem>

                <SelectItem value="isanyof">Is any of</SelectItem>
                <SelectItem value="isnotanyof">Is not any of</SelectItem>

                {/* <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
                <SelectItem value="regex">Regex</SelectItem> */}

                <SelectItem value="isblank">Is Blank</SelectItem>
                <SelectItem value="isnotblank">Is Not Blank</SelectItem>
              </SelectContent>
            </Select>

            {/* Display the Clear | Filter buttons */}
            {(pickerMode === "isanyof" || pickerMode === "isnotanyof") && (
              <>
                <Button size="sm" className="ml-auto justify-end" variant="secondary" onClick={clearSelected}>Clear</Button>
                <Button size="sm" className="justify-end" disabled={optionCount > 0 ? false : true} onClick={saveSelections}>Filter</Button>
              </>
            )}
          </div>

          {(pickerMode === "is" || pickerMode === "isanyof" || pickerMode === "isnotanyof") &&
            !isLoading && !error && (
              <ReactSelect
                onChange={handleReactSelectChange}
                options={transformedData}
                value={selectedOptions}
                isMulti={pickerMode === "is" ? false : true}
                isClearable={false}
                closeMenuOnSelect={false}
                autoFocus
                components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                defaultMenuIsOpen
              />
            )}

          {(pickerMode === "contains" || pickerMode === "startsWith" || pickerMode === "regex") && (
            <>string</>
          )}

        </div>
      </PopoverContent>
    </Popover >
  )
}

export default AccountFilter;
