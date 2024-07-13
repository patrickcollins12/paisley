import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { useEffect } from 'react';
import { generateColoredClassNames, generateDismissableColoredClassNames } from "@/components/ui/badge"
import { clsx } from 'clsx';

export function ReactSelect({ coloredPills, value, options, onChange, valueAsArray, optionsAsArray, isCreatable, ...props }) {

  /** Styling **/
  /** Weird side effects if these aren't defined inside this component **/
  const containerStyles = " ";

  const controlStyles = {
    base: "rounded-sm bg-background hover:cursor-pointer",
    focus: "border border-input ",
    nonFocus: "border border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
  };

  // for some reason this value container has flex grow applied, don't know why.
  // doesn't exist in the multie value one
  const valueContainerStyles = "px-2 py-1 gap-1";
  let singleValueStyles = "py-0.5 px-2.5 text-xs mb-0 font-semibold ";

  let multiValueStyles = "inline-flex items-center pl-2 pr-1 py-0.5 text-xs mb-0 font-semibold";
  let multiValueRemoveStyles = "inline-flex items-center ml-2 px-0.25 py-0.25 text-sm rounded-full bg-transparent font-semibold ";

  const indicatorsContainerStyles = "p-1 gap-1 ";
  const indicatorSeparatorStyles = "bg-gray-300 dark:bg-gray-700";
  const clearIndicatorStyles = "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300";
  const dropdownIndicatorStyles = "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300";

  const inputStyles = "text-xs items-center ";
  const placeholderStyles = "p-2 text-xs items-center text-muted-foreground";

  const menuStyles = "p-1 mt-2 border border-input bg-background rounded-sm text-xs";
  const optionStyles = {
    base: "hover:cursor-pointer px-3 py-2 rounded-sm",
    focus: " active:bg-gray-200 active:bg-gray-800 bg-gray-100 dark:bg-gray-900",
    selected: "opacity-50",
  };
  /** End Styling **/


  multiValueStyles += (coloredPills) ? " rounded-full font-semibold " : " rounded-md bg-secondary "
  singleValueStyles += (coloredPills) ? " rounded-full " : " "

  const styles = {
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

    singleValue: (state) => {
      const classes = clsx(
        coloredPills ? generateColoredClassNames(state.children) : "",
        singleValueStyles,
      )
      return classes
    },

    multiValue: (state) => clsx(
      coloredPills ? generateColoredClassNames(state.children) : "",
      multiValueStyles,
    ),

    multiValueRemove: ({ children, isDisabled }) => {
      // if isDisabled, then turn off the X... how? redo this as a Component, that's how
      return clsx(
        coloredPills ? generateDismissableColoredClassNames(children) : "",
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
  }


  useEffect(() => {
    console.log("ReactSelect value updated:", value);
  }, [value]);
  
  useEffect(() => {
    // console.log("ReactSelect valueAsArray updated:", valueAsArray);
  }, [valueAsArray]);


  // this section is a bug fix, for some reason, when not in 
  // multi mode, the flex:1 was making the pill stretch.
  const manualStyles = {
    valueContainer: (defaultStyles) => {
      if (!props.isMulti) {
        delete defaultStyles.flex
      }
      return defaultStyles
    }
  }

  // // react-select returns an object of value=>option test.
  // // in our instance these are all the same
  // ReactSelect({ ... onChange, valueAsArray, optionsAsArray ... })
  function _localOnChangeHandler(selectedValues) {
    // const selectedValues = selectedOptions.map(item => item.value);
    let values = []
    if (Array.isArray(selectedValues)) {
      values = selectedValues.map(obj => obj.value);
    } else if (typeof selectedValues === 'object' && selectedValues !== null) {
      values = [selectedValues.value];
    }

    onChange(values)
  }

  return isCreatable ? (
    <CreatableSelect
      onChange={_localOnChangeHandler}
      options={options || optionsAsArray?.map(item => ({ value: item, label: item }))}
      value={value || valueAsArray?.map(item => ({ label: item, value: item }))}
      unstyled={true}
      styles={manualStyles}
      classNames={styles}
      {...props}
    />
  ) : (
    <Select
      onChange={_localOnChangeHandler}
      options={options || optionsAsArray?.map(item => ({ value: item, label: item }))}
      value={value || valueAsArray?.map(item => ({ label: item, value: item }))}
      unstyled={true}
      styles={manualStyles}
      classNames={styles}
      {...props}
    />
  )

}
