import CreatableSelect from 'react-select/creatable';
import { Badge, generateColoredClassNames, generateDismissableColoredClassNames } from "@/components/ui/badge"
import { clsx } from 'clsx';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
// import { useFetchTags } from "@/tags/TagApiHooks.js"

/** Styling **/
const containerStyles = "";

const controlStyles = {
  base: "rounded-sm bg-background hover:cursor-pointer",
  focus: "border border-input ",
  nonFocus: "border border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
};

const valueContainerStyles = "p-1 gap-1";
const multiValueStyles = "inline-flex items-center pl-2 pr-1 text-xs mb-0 rounded-lg font-semibold ";
const multiValueRemoveStyles = "inline-flex items-center ms-2 my-1 p-0.5 text-sm rounded-lg bg-transparent ";

const indicatorsContainerStyles = "p-1 gap-1";
const indicatorSeparatorStyles = "bg-gray-300 dark:bg-gray-700";
const clearIndicatorStyles = "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300";
const dropdownIndicatorStyles = "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300";

const inputStyles = "text-xs items-center ";
const placeholderStyles = "text-xs items-center text-muted-foreground";

const menuStyles = "p-1 mt-2 border border-input bg-background rounded-sm text-xs";
const optionStyles = {
  base: "hover:cursor-pointer px-3 py-2 rounded-sm",
  focus: " active:bg-gray-200 active:bg-gray-800 bg-gray-100 dark:bg-gray-900",
  selected: "text-gray-500",
};
/** End Styling **/

export function TagEditorPopover({ values, allValues, onChange, cellValues, contentHeader, inputPlaceholder }) {

  // how to use
  // cellValues is what it will be displays when the popover is closed.
  // if cellValues is the same as the initial value of the Select dropdown, then we set cellValues and data to be the same 
  if (!cellValues) cellValues = values

  // react-select returns an object of value=>option test.
  // in our instance these are all the same
  function extractValuesAndCallOnChange(selectedOptions) {
    const selectedValues = selectedOptions.map(item => item.value);
    onChange(selectedValues)
  }


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

        <CreatableSelect
          onChange={extractValuesAndCallOnChange}
          isMulti
          options={allValues?.map(tag => ({ value: tag, label: tag }))}
          value={values?.map(tag => ({ value: tag, label: tag }))}
          // isDisabled="true"
          autoFocus={true}
          openMenuOnFocus={true}
          placeholder={inputPlaceholder || "Add a tag..."}
          maxMenuHeight={200}
          unstyled={true}
          classNames={{
            control: ({ isFocused }) =>
              clsx(
                isFocused ? controlStyles.focus : controlStyles.nonFocus,
                controlStyles.base,
              ),

            option: ({ isFocused, isSelected }) =>
              clsx(
                isFocused && optionStyles.focus,
                isSelected && optionStyles.selected,
                optionStyles.base,
              ),
            menu: () => menuStyles,
            input: () => inputStyles,

            multiValue: (state) => clsx(
              generateColoredClassNames(state.children),
              multiValueStyles,
            ),

            multiValueRemove: ({ children, isDisabled }) => {
              // if isDisabled, then turn off the X... how? redo this as a Component, that's how
              return clsx(
                generateDismissableColoredClassNames(children),
                multiValueRemoveStyles,
              )
            },
            indicatorsContainer: () => indicatorsContainerStyles,
            clearIndicator: () => clearIndicatorStyles,
            indicatorSeparator: () => indicatorSeparatorStyles,
            dropdownIndicator: () => dropdownIndicatorStyles,

            placeholder: () => placeholderStyles,
            valueContainer: () => valueContainerStyles,
            container: () => containerStyles,
          }}
        />

      </PopoverContent>
    </Popover>
  );

}
