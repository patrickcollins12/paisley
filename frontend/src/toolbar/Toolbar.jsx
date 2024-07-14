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
import { Landmark, Tag } from "lucide-react"

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
          Icon={Tag}
          options={parties.data}
          coloredPills={true}
          operators={lookupOperators}
          onFilterUpdate={onFilterUpdate}
          onFilterClear={onFilterClear}
        />

        {/*         
        <Button variant='secondary' size='sm' className='h-8 bg-blue-200 hover:bg-blue-300 dark:bg-sky-900 font-semibold'>
          <div className="flex flex-row gap-2 items-center">
            <div className=" ">
              <span className="opacity-40">Description not </span>
              Chemist</div>
            <X size={16} className='opacity-50' />
          </div>
        </Button>

        <Button variant='secondary' size='sm' className='h-8 bg-blue-200 hover:bg-blue-300 dark:bg-sky-900 font-semibold'>
          <div className="flex flex-row gap-2 items-center">
            <div>
              <span className="opacity-40">Description /</span>
              <span>Chemist</span>
              <span className="opacity-40">/</span>
            </div>
            <X size={16} className='opacity-50' />
          </div>
        </Button> */}
{/* 
        <Button variant='selected' size='sm' className="h-8">
          <div className="flex flex-row items-center">
            <div className=" ">
              <span className="opacity-40">Description </span>
              Chemist
            </div>
            <span className="p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
              <X size={16} />
            </span>
          </div>
        </Button> */}



{/* 
        <Button variant='selected' size='sm' className="h-8">
          <div className="flex flex-row items-center">
            <div className="">
              <span className="opacity-40">Amount </span>
              &lt;$50</div>

            <span className="p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
              <X size={16} />
            </span>
          </div>
        </Button>

        <Button variant='ghost' size='sm' className='h-8'>
          <div className="flex flex-row gap-2 items-center">
            Party
            <ChevronDown size={16} className='' />
          </div>
        </Button>

        <TagsFilter dataTable={dataTable} />
 */}


      </div>

      <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
        <ColumnSelector dataTable={dataTable} />
      </div>
    </div>
  )
}

export default Toolbar;
