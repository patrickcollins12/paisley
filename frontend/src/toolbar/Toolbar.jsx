import AllFilter from "@/toolbar/AllFilter.jsx"
import DescriptionFilter from "@/toolbar/DescriptionFilter.jsx"
import DateFilter from "@/toolbar/DateFilter.jsx"
import ColumnSelector from "@/toolbar/ColumnSelector.jsx"
import { lookupOperators, numberOperators, stringOperators } from "@/toolbar/FilterExpression.jsx"
import React from "react"
import LookupFilter from "@/toolbar/LookupFilter.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { useFetchTags } from "@/tags/TagApiHooks.js"
import AmountFilter from "@/toolbar/AmountFilter.jsx"
import { Landmark, Tag, UserCheck } from "lucide-react"

function Toolbar({ dataTable, onFilterUpdate, onFilterClear }) {

  const accounts = useAccountData();
  const tags = useFetchTags('tags');
  const parties = useFetchTags('parties');

  return (
    <div className="flex flex-row mb-4">

      <div className="flex flex-row space-x-2">
        <AllFilter
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

        <DescriptionFilter
          operators={stringOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear} />

        <DateFilter
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

        <AmountFilter
          operators={numberOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

        <LookupFilter
          label="Account"
          field="account_shortname"
          Icon={Landmark}
          options={ () => {
            if (!accounts.data) return [];
            return Object.keys(accounts.data).map(key => accounts.data[key].shortname)  
          
          }}
          coloredPills={false}
          operators={lookupOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

        <LookupFilter
          label="Tags"
          field="tags"
          Icon={Tag}
          options={tags.data}
          coloredPills={true}
          operators={lookupOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />
        <LookupFilter
          label="Party"
          field="party"
          Icon={UserCheck}
          options={parties.data}
          coloredPills={true}
          operators={lookupOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

      </div>

      <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
        <ColumnSelector dataTable={dataTable} />
      </div>
    </div>
  )
}

export default Toolbar;
