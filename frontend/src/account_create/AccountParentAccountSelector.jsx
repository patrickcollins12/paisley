import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import Select from 'react-select';
import useAccountData from "@/accounts/AccountApiHooks.js"

import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

const AccountCurrencySelector = ({ form, name, label, description, ...props }) => {
  const { t } = useTranslation();

  const { data, error, isLoading } = useAccountData();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (data) {
      // get active accounts and match their id and shortname into label and value object.
      const accounts = data
        .filter(acc => acc.status !== "inactive")
        .map(acc => {
          return { label: `${acc.name} (${acc.institution})`, value: acc.accountid }
        });

        // console.log(accounts);
      setAccounts(accounts);
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
              <Select
                id={name}
                options={accounts}
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


export default AccountCurrencySelector;
