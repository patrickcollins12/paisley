import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"

import { ReactSelect } from '@/components/ReactSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function AccountFilter() {
  const { data, error, isLoading } = useAccountData()
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [transformedData, setTransformedData] = useState([]);

  const handleChange = (selected) => {
    setSelectedOptions(selected);
  };

  useEffect(() => {
    if (data) {
      const transformed = Object.values(data).map(item => ({
        label: `${item.institution} ${item.name}`,
        value: item.accountid
      }));

      console.log(transformed)
      setTransformedData(transformed);
    }
  }, [data]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8'>
          <div className="flex flex-row gap-2 items-center">
            Account
            <ChevronDown size={16} className='mr-1' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className="w-[400px]">
        <div className="text-xs">
          <Select>
            <SelectTrigger className="border-0 text-xs mb-3 w-auto inline-flex">
              <SelectValue placeholder="Is any of" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="is">Is</SelectItem>
              <SelectItem value="any">Is any of</SelectItem>
              <SelectItem value="excludes">Is not any of</SelectItem>
              <SelectItem value="isblank">Is Blank</SelectItem>
              <SelectItem value="isnotblank">Is Not Blank</SelectItem>
            </SelectContent>
          </Select>

          {!isLoading && !error && (
            <ReactSelect
              onChange={handleChange}
              options={transformedData}
              value={selectedOptions}
              isMulti
              isClearable={false}
              autoFocus
              defaultMenuIsOpen
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AccountFilter;
