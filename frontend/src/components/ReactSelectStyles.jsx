import { clsx } from 'clsx';
import { components } from 'react-select';
import { ChevronDown } from "lucide-react";
import { generateColoredClassNames, generateDismissableColoredClassNames } from "@/components/ui/badge.jsx"

export const getSelectClassNames = ({ coloredPills = false } = {}) => {

    return {
        control: ({ isFocused }) =>
            clsx(
                isFocused ? "border border-input" : "border border-gray-200 dark:border-gray-800",
                "rounded-md bg-background hover:cursor-pointer"
            ),

        option: ({ isFocused, isSelected }) =>
            clsx(
                isFocused && "active:bg-gray-200 active:bg-gray-800 bg-gray-100 dark:bg-gray-900",
                isSelected && "opacity-50",
                "hover:cursor-pointer px-3 py-2 rounded-sm"
            ),

        menu: () => "p-1 mt-2 border border-input bg-background rounded-sm text-xs",
        input: () => "text-xs items-center ml-0",

        singleValue: (state) => {
            const classes = clsx(
                coloredPills ? generateColoredClassNames(state.children) : "",
                "py-0.5 px-1 text-xs mb-0",
                coloredPills ? "rounded-full font-semibold" : ""
            )
            return classes
        },


        multiValue: (state) =>
            clsx(
                coloredPills ? generateColoredClassNames(state.children) : "",
                "inline-flex items-center pl-2 pr-1 py-0.5 text-xs mb-0",
                coloredPills ? "rounded-full font-semibold" : "rounded-md bg-secondary"
            ),

        multiValueRemove: ({ children, isDisabled }) => {
            // if isDisabled, then turn off the X... how? redo this as a Component, that's how
            return clsx(
                coloredPills ? generateDismissableColoredClassNames(children) : "",
                "inline-flex items-center ml-2 px-0.25 py-0.25 text-sm rounded-full bg-transparent font-semibold"
            )
        },

        indicatorsContainer: () => "p-1 gap-1",
        clearIndicator: () => "p-1 text-gray-500 rounded-md hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300",
        indicatorSeparator: () => "bg-gray-300 dark:bg-gray-700",
        dropdownIndicator: () => "p-1 mx-1 text-gray-500",
        placeholder: () => "p-1 text-xs items-center text-muted-foreground",
        valueContainer: () => "px-2 py-1 gap-1",
        container: () => " ",
    };
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
