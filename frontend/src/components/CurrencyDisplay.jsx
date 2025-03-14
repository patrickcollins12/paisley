// import { formatCurrency } from "@/lib/localisation_utils.js";
import React from 'react';
import { cn } from "@/lib/utils";
import LocaleCurrency from 'locale-currency';


/* options = {
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
    options.currency ||= LocaleCurrency.getCurrency(options.locale);
    options.style ||= "currency";

    if (value == null || value === '' || isNaN(value)) {
        return options.blankIsZero ? '0' : '';
    }

    value = Number(value);
    if (value === 0 && options.zeroIsBlank) return '';

    return new Intl.NumberFormat(options.locale, options).format(value);
}


export function formatCurrencyOld(value, options = {}) {
    let browserLocale = navigator.language;

    // test different locales
    // browserLocale = "de-DE"; // should display values like 1.234,56 A$


    // this module will return the currency code for the locale
    // note this will almost always be ignored because it is 
    // this is an expensive call, so only call it if no currency was passed in
    let localeCurrency = ""
    if (!options.locale) {
         localeCurrency= LocaleCurrency.getCurrency(browserLocale)
    }

    const {
        cents = true,
        style = "currency",
        locale = browserLocale,
        currency = localeCurrency,
        currencySign,
        zeroIsBlank = false,
        blankIsZero = false,
        caller = 0
    } = options;

    // Handle blank value or non-number case
    if (value === null || value === undefined || value === '' || typeof value !== "number") {
        if (blankIsZero) {
            value = 0
        } else {
            return '';
        }
    }

    // Handle zero value case
    if (value === 0 && zeroIsBlank) { return '' }

    // Prepare the options for the number formatting
    const IntlOptions = {
        // style: style,
        currency: currency,
        currencySign: currencySign,
        minimumFractionDigits: cents ? 2 : 0,  // Conditionally set the decimal places
        maximumFractionDigits: cents ? 2 : 0,   // Conditionally set the decimal places
        x: 2,
        ...options
    };

    const formattedValue = new Intl.NumberFormat(locale, IntlOptions).format(value);
    return formattedValue;
}

{/* <Currency zeroIsBlank={true} className={"text-green-500} currencySign="accounting">123</Currency> */ }
// To use this component please pass through the options for Intl.NumberFormat as props
const Currency = React.forwardRef(({ children, className, ...props }, ref) => {

    const formattedValue = formatCurrency(children, props);

    const c = "" //"text-right whitespace-nowrap";

    return (
        <div className={cn(c, className)} ref={ref}>
            {formattedValue}
        </div>
    );
});

export { Currency }

