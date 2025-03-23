import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import { Input } from "@/components/ui/input"
import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

const AccountTimezoneSelector = ({ form, name, label, description, ...props }) => {
    const [timezones, setTimezones] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        const tz = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : undefined;
        setTimezones(tz);
    }, []);

    return timezones && timezones.length > 0 ? (
        <FormField
            name={name}
            control={form.control}
            render={({ field }) => {
                return (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
                        <FormLabel htmlFor={name} className="text-right mr-3">
                            {label}
                        </FormLabel>
                        <FormControl>
                            <Select
                                id={name}
                                options={timezones.map(tz => ({ label: tz, value: tz }))}
                                // TODO, value doesn't sync to this.
                                defaultValue={{ label: field.value, value: field.value }}
                                onChange={field.onChange}
                                className="col-span-2"
                                unstyled
                                isClearable
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
                )
            }}
        />
    ) : (
        <FormField
            name={name}
            control={form.control}
            render={({ field }) => (
                <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
                    <FormLabel htmlFor={name} className="text-right mr-3">
                        {label}
                    </FormLabel>
                    <FormControl>
                        <Input
                            id={name}
                            className="col-span-2"
                            data-1p-ignore
                            autoComplete="off"
                            {...field}
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
