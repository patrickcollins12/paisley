import React from 'react';
import { cn } from "@/lib/utils";
import LocaleCurrency from 'locale-currency';

/* 
options = {
    locale: "en-US",
    currency: "USD",
    currencySign: "accounting",
    zeroIsBlank = true,
    blankIsZero = false,
    maximumFractionDigits: 0,
} 

A full set of options can be found here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#parameters
*/

export function formatCurrency(value, options = {}) {

    // set the defaults if not passed in
    options.locale ||= navigator.language;
    (options.currency = options.currency ?? LocaleCurrency.getCurrency(options.locale)) ?? delete options.currency;

    // If currency is missing or invalid, use "decimal" format instead of "currency"
    options.style ||= options.currency ? "currency" : "decimal";

    if (value == null || value === '' || isNaN(value)) {
        return options.blankIsZero ? '0' : '';
    }

    value = Number(value);

    if (value === 0 && options.zeroIsBlank) return '';

    try {
        return new Intl.NumberFormat(options.locale, options).format(value);    
    } catch (error) {
        console.error("formatCurrency Error:", error);
        return "0"; // Fallback text to prevent crashes
    }

}

/*
    How to use:
    <Currency zeroIsBlank={true} className={"text-green-500} currencySign="accounting">123.23</Currency> 

    See above for the full list of props you can pass through to IntlOptions
*/
export const Currency = React.forwardRef(({ children, className, ...props }, ref) => {

    const formattedValue = formatCurrency(children, props);

    // if in future we want default className formatting:
    const c = "text-right whitespace-nowrap block";

    return (
        <span className={cn(c, className)} ref={ref}>
            {formattedValue}
        </span>
    );
});

