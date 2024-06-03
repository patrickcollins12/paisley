import DescriptionFilter from "@/toolbar/DescriptionFilter.jsx"
import TagsFilter from "@/toolbar/TagsFilter.jsx"
import AccountFilter from "@/toolbar/AccountFilter.jsx"
import DateFilter from "@/toolbar/DateFilter.jsx"
import ColumnSelector from "@/toolbar/ColumnSelector.jsx"
import { Button } from "@/components/ui/button.jsx"
import { ChevronDown, X } from "lucide-react"


function Toolbar({ dataTable }) {

  return (
    <div className="flex flex-row mb-4">

      <div className="flex flex-row space-x-2">

        <DescriptionFilter dataTable={dataTable} />


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
        </Button>

        <DateFilter dataTable={dataTable} />
        <AccountFilter dataTable={dataTable} />

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



      </div>

      <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
        <ColumnSelector dataTable={dataTable} />
      </div>

    </div>
  )
}

export default Toolbar;
