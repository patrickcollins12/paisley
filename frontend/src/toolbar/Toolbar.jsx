import DescriptionFilter from "@/toolbar/DescriptionFilter.jsx"
import TagsFilter from "@/toolbar/TagsFilter.jsx"
import AccountFilter from "@/toolbar/AccountFilter.jsx"
import ColumnSelector from "@/toolbar/ColumnSelector.jsx"

function Toolbar({ dataTable }) {

  return (
    <div className="flex flex-row mb-4">

      <div className="flex flex-row basis-1/2 space-x-2">
        <DescriptionFilter dataTable={dataTable} />
        <TagsFilter dataTable={dataTable} />
        <AccountFilter dataTable={dataTable} />
      </div>

      <div className='flex flex-row-reverse basis-1/2 space-x-2 space-x-reverse'>
        <ColumnSelector dataTable={dataTable} />
      </div>

    </div>
  )
}

export default Toolbar;
