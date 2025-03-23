import { clsx } from 'clsx';
import { components } from 'react-select';
import { ChevronDown } from "lucide-react";

export const controlStyles = {
    base: "rounded-md bg-background hover:cursor-pointer",
    focus: "border border-input ",
    nonFocus: "border border-gray-200 dark:border-gray-800",
};

const optionStyles = {
    base: "hover:cursor-pointer px-3 py-2 rounded-sm",
    focus: " active:bg-gray-200 active:bg-gray-800 bg-gray-100 dark:bg-gray-900",
    selected: "opacity-50",
};

const valueContainerStyles = "px-2 py-1 gap-1";
let singleValueStyles = "py-0.5 px-1 text-xs mb-0 ";
let multiValueStyles = "inline-flex items-center pl-2 pr-1 py-0.5 text-xs mb-0 rounded-md bg-secondary";
let multiValueRemoveStyles = "inline-flex items-center ml-2 px-0.25 py-0.25 text-sm rounded-full bg-transparent";
const indicatorsContainerStyles = "p-1 gap-1 ";
const indicatorSeparatorStyles = "bg-gray-300 dark:bg-gray-700";
const clearIndicatorStyles = "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300";
const dropdownIndicatorStyles = "p-1 mx-1 text-gray-500";
const inputStyles = "text-xs items-center ml-0";
const placeholderStyles = "p-1 text-xs items-center";
const menuStyles = "p-1 mt-2 border border-input bg-background rounded-sm text-xs";
const containerStyles = " ";

export const selectClassNames = {
    control: ({ isFocused }) =>
        clsx(isFocused ? controlStyles.focus : controlStyles.nonFocus, controlStyles.base),
    option: ({ isFocused, isSelected }) =>
        clsx(isFocused && optionStyles.focus, isSelected && optionStyles.selected, optionStyles.base),
    menu: () => menuStyles,
    input: () => inputStyles,
    singleValue: () => clsx("", singleValueStyles),
    multiValue: () => clsx("", multiValueStyles),
    multiValueRemove: () => clsx("", multiValueRemoveStyles),
    indicatorsContainer: () => indicatorsContainerStyles,
    clearIndicator: () => clearIndicatorStyles,
    indicatorSeparator: () => indicatorSeparatorStyles,
    dropdownIndicator: () => dropdownIndicatorStyles,
    placeholder: () => placeholderStyles,
    valueContainer: () => valueContainerStyles,
    container: () => containerStyles,
};

export const manualValueContainerFix = (isMulti) => ({
    valueContainer: (defaultStyles) => {
        if (!isMulti) delete defaultStyles.flex;
        return defaultStyles;
    },
});

export const DropdownIndicator = (props) => (
    <components.DropdownIndicator {...props}>
        <ChevronDown size={16} />
    </components.DropdownIndicator>
);
