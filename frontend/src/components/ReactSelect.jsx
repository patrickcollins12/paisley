import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { useEffect } from 'react';
import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

export function ReactSelect({
  coloredPills = true,
  value,
  options,
  onChange,
  valueAsArray,
  optionsAsArray,
  isCreatable,
  ...props
}) {


  const localOnChange = (selectedValues) => {
    let values = [];
    if (Array.isArray(selectedValues)) {
      values = selectedValues.map(obj => obj.value);
    } else if (typeof selectedValues === 'object' && selectedValues !== null) {
      values = [selectedValues.value];
    }
    onChange(values);
  };

  const sharedProps = {
    onChange: localOnChange,
    options: options || optionsAsArray?.map(item => ({ value: item, label: item })),
    value: value || valueAsArray?.map(item => ({ label: item, value: item })),
    unstyled: true,
    styles: manualValueContainerFix(props.isMulti),
    classNames: getSelectClassNames({ coloredPills }),
    components: { DropdownIndicator, IndicatorSeparator: null },
    ...props,
  };

  return isCreatable
    ? <CreatableSelect {...sharedProps} />
    : <Select {...sharedProps} />;
}
