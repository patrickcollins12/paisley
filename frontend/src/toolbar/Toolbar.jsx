import AllFilter from "@/toolbar/AllFilter.jsx"
import DescriptionFilter from "@/toolbar/DescriptionFilter.jsx"
import DateFilter from "@/toolbar/DateFilter.jsx"
import ColumnSelector from "@/toolbar/ColumnSelector.jsx"
import {
  allFilterOperators,
  dateOperators,
  lookupOperators,
  lookupTagOperators,
  numberOperators,
  stringOperators
} from "@/toolbar/FilterExpression.jsx"
import React from "react"
import LookupFilter from "@/toolbar/LookupFilter.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { useFetchTags } from "@/tags/TagApiHooks.js"
import AmountFilter from "@/toolbar/AmountFilter.jsx"
import { Landmark, Tag, UserCheck } from "lucide-react"
import { useSearch } from "@/components/search/SearchContext.jsx"
import { Button } from "@/components/ui/button.jsx"

function Toolbar({ dataTable }) {

  const searchContext = useSearch();

  const accounts = useAccountData();
  const tags = useFetchTags('tags');
  const parties = useFetchTags('parties');

  return (
    <div className="flex flex-row mb-4">

      <div className="flex flex-row space-x-2 items-center">
        <AllFilter operators={allFilterOperators} />

        <DescriptionFilter operators={stringOperators} />

        <DateFilter operators={dateOperators} />

        <AmountFilter operators={numberOperators} />

        <LookupFilter
          label="Account"
          field="account_shortname"
          Icon={Landmark}
          options={() => {
            if (!accounts.data) return [];
            return Object.keys(accounts.data).map(key => accounts.data[key].shortname)

          }}
          coloredPills={false}
          operators={lookupOperators}
        />

        <LookupFilter
          label="Tags"
          field="tags"
          Icon={Tag}
          options={tags.data}
          coloredPills={true}
          operators={lookupTagOperators}
        />
        <LookupFilter
          label="Party"
          field="party"
          Icon={UserCheck}
          options={parties.data}
          coloredPills={true}
          operators={lookupOperators}
        />

        <Button
          onClick={() => searchContext.clear()}
          variant='ghost'
          className="h-8 p-3 text-left font-normal">Clear</Button>
        <Button
          onClick={() => searchContext.save()}
          variant='ghost'
          className="h-8 p-3 text-left font-normal">Save</Button>

      </div>

      <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
        <ColumnSelector dataTable={dataTable} />
      </div>
    </div>
  )
}

export default Toolbar;
