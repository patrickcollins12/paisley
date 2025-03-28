import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import { Input } from "@/components/ui/input"
import { getSelectClassNames, manualValueContainerFix, DropdownIndicator } from "@/components/ReactSelectStyles"

// const AccountTimezoneSelector = ({ form, name, label, description, ...props }) => {
const AccountTimezoneSelector = ({
    name,
    label,
    description,
    value,
    onChange,
    ...props
}) => {

    const [timezones, setTimezones] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        const tz = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : undefined;
        setTimezones(tz);
    }, []);

    if (!timezones || timezones.length === 0)
        return (
            <div className="text-red-500">
                {t("ERROR:Timezone data is not available")}
            </div>
        )

    return (
        <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
            <FormLabel htmlFor={name} className="text-right mr-3">
                {label}
            </FormLabel>
            <FormControl>
                <Select
                    id={name}
                    options={timezones.map(tz => ({ label: tz, value: tz }))}
                    value={value}
                    onChange={onChange}
                    className="col-span-2"
                    unstyled
                    // isClearable
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
};

export default AccountTimezoneSelector;
