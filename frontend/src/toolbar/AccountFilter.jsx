import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"

import { ReactSelect } from '@/components/ReactSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function AccountFilter() {
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

  // when selectedOptions changes by React Select
  useEffect(() => {
    let save = false
    if (pickerMode === "isanyof" || pickerMode === "isnotanyof") {
      if (isFilterActive) save = true
    } else {
      save = true
    }

    if (save) saveValues()

  }, [selectedOptions]);

    // when isFilterActive changes
  useEffect(() => {
    saveValues()
  }, [isFilterActive]);


  const saveValues = () => { 
    console.log(`Saving: isFilterActive: ${isFilterActive}, pickerMode: \"${pickerMode}\", selectedOptions: ${JSON.stringify(_retrieveSelectedValues())}`)
  }

  const handleReactSelectChange = (selected) => {

    setSelectedOptions(selected);
    const itemCount = Array.isArray(selected) ? selected?.length : 1
    setOptionCount(itemCount)

    // for a single select, close the popover once selected
    if (pickerMode === "is" && itemCount > 0) {
      setIsFilterActive(true)
      setPopoverOpen(false)
      // saveSelected()
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
    e.stopPropagation();
  };

  const saveSelections = () => {
    setIsFilterActive(optionCount > 0 ? true : false)
    setPopoverOpen(false)
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

  const _retrieveSelectedValues = () => {
    if (Array.isArray(selectedOptions)) {
      return selectedOptions.map(obj => obj.value);
    } else {
      return [selectedOptions?.value]
    }
  }

  function renderButtonLabel(label) {

    if (pickerMode === "isblank") {
      return (<><span className="opacity-40">Account&nbsp;</span>is blank </>)
    }
    else if (pickerMode === "isnotblank") {
      return (<><span className="opacity-40">Account&nbsp;</span> is not blank</>)
    }
    else if ((pickerMode === "is" || pickerMode === "isanyof" || pickerMode === "isnotanyof") && optionCount) {
      return (
        <>
          <span className="opacity-40 pr-2">{label}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black bg-opacity-30 dark:bg-opacity-30">
            {optionCount}
          </span>
        </>
      )
    }
    else {
      // handle strings etc
    }
  }

  function renderButtonShell(label) {
    return (

      <Button
        id={label} size='sm'
        variant={isFilterActive ? "selected" : "ghost"}
        className="h-8 pl-3 pr-0 py-3 justify-start text-left font-normal">

        <div className="flex flex-row font-semibold items-center">
          <>
            {isFilterActive ? (
              <>
                {renderButtonLabel(label)}
                <span onClick={clearSelected} className="p-2 text-slate-500 hover:text-black dark:hover:text-white">
                  <X size={16} />
                </span>
              </>
            ) : (
              <span className="inline-flex gap-2 pr-2 items-center">
                {label}
                <ChevronDown size={16} />
              </span>
            )}
          </>

        </div>
      </Button>
    )
  }

  // TODO add onKeyDown escape propagates all the way up to close the popover
  return (

    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        {renderButtonShell("Account")}
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

                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="startsWith">Starts With</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>

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
