import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import CreatableSelect from 'react-select/creatable';
import useAccountData from "@/accounts/AccountApiHooks.js"

import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

const AccountInstitutionSelector = ({ form, name, label, description, ...props }) => {

  const { data, error, isLoading } = useAccountData();
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    if (data) {

      const institutionsMap = new Map();

      data.forEach(acc => {
        if (acc.institution && !institutionsMap.has(acc.institution)) {
          institutionsMap.set(acc.institution, { label: acc.institution, value: acc.institution });
        }
      });

      const institutions = Array.from(institutionsMap.values());

      setInstitutions(institutions);
      console.log(institutions);
    }
  }, [data]);

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
                options={institutions}
                value={field.value}
                onChange={field.onChange}
                className="col-span-2"
                isClearable
                isCreatable
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


export default AccountInstitutionSelector;
