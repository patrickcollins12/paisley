import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import currencyData from 'currency-codes/data'
import { selectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

const AccountCurrencySelector = ({ form, name, ...props }) => {
  const [currencies, setCurrencies] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const blocklist = ["XBA", "XBB", "XBC", "XBD", "XDR", "XPD", "XPT", "XTS", "XXX", "XUA", "XAU", "XAG"];
    const transformed = currencyData
      .filter(c => !blocklist.includes(c.code))
      .map(c => ({ label: `${c.currency} (${c.code})`, value: c.code }));
    setCurrencies(transformed);
  }, []);

  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field }) => (
        <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
          <FormLabel htmlFor={name} className="text-right mr-3">{t("Currency")}</FormLabel>
          <FormControl>
            <Select
              id={name}
              options={currencies}
              value={field.value}
              onChange={field.onChange}
              placeholder={t("Select currency")}
              className="col-span-2"
              unstyled
              styles={manualValueContainerFix(props.isMulti)}
              classNames={selectClassNames}
              components={{ DropdownIndicator, IndicatorSeparator: null }}
            />
          </FormControl>
          <FormMessage className="col-start-2 col-span-2" />
          <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500" />
        </FormItem>
      )}
    />
  );
};

export default AccountCurrencySelector;
