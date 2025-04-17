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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Eraser, Trash2, Save } from "lucide-react"

function Toolbar({ dataTable, onResetLayout, currentColumnSizing }) {

  const searchContext = useSearch();

  const accounts = useAccountData();
  const tags = useFetchTags('tags');
  const parties = useFetchTags('parties');

  // Helper to generate keys for LookupFilter components
  const getLookupFilterKey = (field) => {
    // Use the field name and a stable JSON representation of the filters for that field
    // This ensures the key changes only when the relevant filters change
    return `${field}_${JSON.stringify(searchContext.getFilters(field))}`;
  };

  // Helper to generate a key for AllFilter based on all active filters
  const getAllFilterKey = () => {
    // Get the entire array of active filters and stringify it for a stable key
    return `all_${JSON.stringify(searchContext.getFilters())}`;
  };

  return (
    <div className="flex flex-row items-start mb-4 space-x-4">

      <div className="flex flex-row flex-wrap gap-x-2 gap-y-2 items-center flex-grow">
        <AllFilter key={getAllFilterKey()} operators={allFilterOperators} />

        <DescriptionFilter key={getLookupFilterKey('description')} operators={stringOperators} />

        <DateFilter key={getLookupFilterKey('date')} operators={dateOperators} />

        <AmountFilter key={getLookupFilterKey('amount')} operators={numberOperators} />

        <LookupFilter
          key={getLookupFilterKey('account_shortname')}
          label="Account"
          field="account_shortname"
          Icon={Landmark}
          options={() => {
            if (!accounts.data) return [];
            return Object.keys(accounts.data).map(key => accounts.data[key].shortname).sort();
          }}
          coloredPills={false}
          operators={lookupOperators}
        />

        <LookupFilter
          key={getLookupFilterKey('tags')}
          label="Tags"
          field="tags"
          Icon={Tag}
          options={tags.data}
          coloredPills={true}
          operators={lookupTagOperators}
        />
        <LookupFilter
          // key={getLookupFilterKey('party')}
          label="Party"
          field="party"
          Icon={UserCheck}
          options={parties.data}
          coloredPills={true}
          operators={lookupOperators}
        />

        {searchContext.savedSearches && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3 font-semibold">
                Filters<ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => searchContext.save?.()}
                
              >
                <Save className="mr-2 h-4 w-4" />
                <span>Save the Current Filters...</span>
                
              </DropdownMenuItem>

              {searchContext.savedSearches.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Load from these filters</DropdownMenuLabel>
                  {searchContext.savedSearches.map((name) => (
                    <DropdownMenuItem
                      key={name}
                      onSelect={() => searchContext.loadSearch(name)}
                      className="group flex justify-between items-center pr-2"
                    >
                      <span>{name}</span>
                      <Trash2
                        className="h-4 w-4 text-gray-400 ml-4 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        onClick={(e) => {
                          e.stopPropagation();
                          searchContext.deleteSearch?.(name);
                        }}
                        title={`Delete "${name}"`}
                      />
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          onClick={() => searchContext.clear?.()}
          variant='ghost'
          size="sm"
          className="h-8 px-2 lg:px-3 text-left font-normal"
          title="Clear all active filters"
        >
          Clear
        </Button>

      </div>

      <div className='flex justify-end flex-shrink-0'>
        {dataTable && (
          <ColumnSelector
            dataTable={dataTable}
            currentColumnSizing={currentColumnSizing}
            onResetLayout={onResetLayout}
          />
        )}
      </div>

    </div>
  )
}

export default Toolbar;
