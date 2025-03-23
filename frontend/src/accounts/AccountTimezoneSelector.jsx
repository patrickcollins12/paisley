import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import { Input } from "@/components/ui/input"
import { selectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

const AccountTimezoneSelector = ({ form, name, ...props }) => {
    const [timezones, setTimezones] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        const tz = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : undefined;
        setTimezones(tz);
    }, []);

    return timezones && timezones.length > 0 ? (
        <FormField
            name="timezone"
            control={form.control}
            render={({ field }) => (
                <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
                    <FormLabel htmlFor="timezone" className="text-right mr-3">{t("Timezone")}</FormLabel>
                    <FormControl>
                        <Select
                            id="timezone"
                            options={timezones.map(tz => ({ label: tz, value: tz }))}
                            defaultValue={{ label: field.value, value: field.value }}
                            onChange={field.onChange}
                            placeholder={t("Select Timezone")}
                            className="col-span-2"
                            unstyled
                            styles={manualValueContainerFix(props.isMulti)}
                            classNames={selectClassNames}
                            components={{ DropdownIndicator, IndicatorSeparator: null }}
                        />
                    </FormControl>
                    <FormMessage className="col-start-2 col-span-2" />
                </FormItem>
            )}
        />
    ) : (
        <FormField
            name="timezone"
            control={form.control}
            render={({ field }) => (
                <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
                    <FormLabel htmlFor="timezone" className="text-right mr-3">{t("Timezone")}</FormLabel>
                    <FormControl>
                        <Input
                            id="timezone"
                            {...field}
                            className="col-span-2"
                            data-1p-ignore
                            autoComplete="off"
                        />
                    </FormControl>
                    <FormMessage className="col-start-2 col-span-2" />
                    <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("Enter a valid timezone string from the IANA Time Zone Database.")}
                    </FormDescription>
                </FormItem>
            )}
        />
    );
};

export default AccountTimezoneSelector;
