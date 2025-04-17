import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import CreatableSelect from 'react-select/creatable';
import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

// Import the central definition
import { accountTypes } from '../icons/accountTypes.js';

const AccountTypeSelector = ({ form, name, label, description, ...props }) => {
  const { t } = useTranslation();

  // Generate types dynamically
  const types = accountTypes.map(type => ({
    label: t(type.labelKey),
    value: type.value // Use lowercase value from central definition
  }));

  return (
    <>
      <FormField
        name={name}
        control={form.control}
        render={({ field }) => (
          <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
            <FormLabel htmlFor="type" className="text-right mr-3">
              {label}
            </FormLabel>
            <FormControl>
              <CreatableSelect
                id={name}
                options={types}
                value={field.value}
                onChange={field.onChange}
                className="col-span-2"
                isClearable
                unstyled
                styles={manualValueContainerFix(props.isMulti)}
                classNames={getSelectClassNames()}
                components={{ DropdownIndicator, IndicatorSeparator: null }}
                {...props}
              />
            </FormControl>
            <FormMessage className="col-start-2 col-span-2" />
            <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
              {description}
              </FormDescription>
          </FormItem>
        )}
      />

    </>
  );
};

export default AccountTypeSelector;
