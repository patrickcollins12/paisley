"use client"

import { useEffect, useState } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check } from "lucide-react"
import currencyData from 'currency-codes/data'; // Use 'import' instead of 'require'
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

const AccountCurrencySelector = ({ form, name }) => {
    const [currencies, setCurrencies] = useState([]); // State to store the transformed currencies
    const { t } = useTranslation()

    console.log("Name:", name);
    
    useEffect(() => {
        // Transform the currency data into the desired format
        const transformedCurrencies = currencyData.map(currency => {
            const { code, currency: currencyName } = currency;
            return { label: `${currencyName} (${code})`, value: code };  // Return the desired format
        });

        setCurrencies(transformedCurrencies);
    }, []);

    return (
        <FormField
            name={name}
            control={form.control}
            render={({ field }) => (
                <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
                    <FormLabel htmlFor={name} className="text-right mr-3">
                        {t("Currency")}
                    </FormLabel>

                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between"
                                >
                                    {field.value
                                        ? currencies.find((c) => c.value === field.value)?.label
                                        : "Select currency"}
                                    <ChevronDown className="opacity-50" size={16} />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="p-0">
                            <Command>
                                <CommandInput
                                    placeholder={t("Filter...")}
                                    className="h-9"
                                />

                                <CommandList>
                                    <CommandEmpty>
                                        {t("No currency found.")}
                                    </CommandEmpty>

                                    <CommandGroup>
                                        {currencies && currencies.map((c) => (
                                            <CommandItem
                                                value={c.label}
                                                key={c.value}
                                                onSelect={() => {
                                                    // Ensure form state updates with the selected currency
                                                    form.setValue(name, c.value);
                                                }}
                                            >
                                                {c.label}
                                                <Check className={cn(
                                                    "ml-auto",
                                                    c.value === field.value ? "opacity-100" : "opacity-0"
                                                )} />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <FormMessage className="col-start-2 col-span-2" />
                    <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("Refer to ISO 4217 currency codes. e.g. AUD, USD, EUR")}
                    </FormDescription>
                </FormItem>
            )}
        />
    );
};

export default AccountCurrencySelector;
