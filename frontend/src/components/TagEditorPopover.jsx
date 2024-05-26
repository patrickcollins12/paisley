import { Badge, generateColoredClassNames, generateDismissableColoredClassNames } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
// import { useFetchTags } from "@/tags/TagApiHooks.js"
import { TagEditor } from "@/components/TagEditor.jsx"


export function TagEditorPopover({ values, allValues, updateHandler, cellValues, contentHeader, ...props }) {

  // how to use
  // cellValues is what it will be displays when the popover is closed.
  // if cellValues is the same as the initial value of the Select dropdown, then we set cellValues and data to be the same 
  if (!cellValues) cellValues = values

  // // react-select returns an object of value=>option test.
  // // in our instance these are all the same
  // function extractValuesAndCallOnChange(selectedOptions) {
  //   const selectedValues = selectedOptions.map(item => item.value);
  //   updateHandler(selectedValues)
  // }

  return (
    <Popover>
      <PopoverTrigger asChild>

        <div className="min-h-[26px] ">
          {cellValues?.map((tag, index) => {
            return (
              <Badge
                variant="colored"
                key={index}>{tag}</Badge>
            );
          })}
        </div>

      </PopoverTrigger>
      {/* <PopoverContent className='w-[450px] p-3 absolute -top-[53px] -left-[19px]' align='start'> */}
      <PopoverContent className='w-[450px] p-3 ' align='start'>
        {contentHeader || ""}

        <TagEditor
          values={values}
          allValues={allValues}
          updateHandler={updateHandler}
          {...props}
        />

        {/* 
        placeholder
        isClearable={true}
        maxMenuHeight={200}
        // autoFocus={true}
        openMenuOnFocus={true} 
        isDisabled="true"
        autoFocus={true}
        openMenuOnFocus={true}
        placeholder={inputPlaceholder || "Add a tag..."}
        maxMenuHeight={200}
        */}

      </PopoverContent>
    </Popover>
  );

}
