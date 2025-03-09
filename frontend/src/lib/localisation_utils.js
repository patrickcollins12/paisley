import { DateTime } from 'luxon'

export function formatCurrency(value, options = {}) {
    const { 
        cents = true, 
        locale = 'en-US', 
        currency = "USD", 
        zeroIsBlank = false,
        blankIsZero = false
    } = options;

    // Handle blank value case
    if (value === null || value === undefined || value === '') {
        return blankIsZero ? "$0" : '';
    }

    if (typeof value !== "number") {
        return cents ? "$0.00" : "$0"; // Ensure proper fallback
    }

    // Handle zero value case
    if (value === 0) {
        return zeroIsBlank ? '' : (cents ? "$0.00" : "$0");
    }

    // Prepare the options for the number formatting
    const IntlOptions = {
        style: "currency",
        currency: currency,
        minimumFractionDigits: cents ? 2 : 0,  // Conditionally set the decimal places
        maximumFractionDigits: cents ? 2 : 0   // Conditionally set the decimal places
    };

    const formattedValue = new Intl.NumberFormat(locale, IntlOptions).format(value);
    return formattedValue;
}

export function formatInterest(value) {
    if (typeof value !== "number") return ""; // Ensure proper fallback

    return `${value * 100}%`;
}



export function formatAbsoluteDate(dateTimeStr) {
    const t = DateTime.fromISO(dateTimeStr);
    if (!t.isValid) return ""; // Error handling for invalid date

    const now = DateTime.now();
    const yesterday = now.minus({ days: 1 });
    let dateDisplay = "";

    if (t.hasSame(now, "day")) {
        dateDisplay = "Today";
    } else if (t.hasSame(yesterday, "day")) {
        dateDisplay = "Yesterday";
    } else {
        dateDisplay = t.toFormat("d MMM");
        if (t.year !== now.year) {
            dateDisplay += t.toFormat(" yyyy");
        }
    }

    return dateDisplay;
}

export function formatDeltaDate(dateTimeStr) {
    const t = DateTime.fromISO(dateTimeStr);
    if (!t.isValid) return ""; // Error handling for invalid date

    const diff = t.diffNow();
    let deltaDisplay = "";
    const isFuture = diff.toMillis() > 0;
    const suffix = isFuture ? "in " : "";
    const postfix = isFuture ? "" : " ago";

    if (Math.abs(diff.as("seconds")) < 60) {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("seconds")))}s${postfix}`;
    } else if (Math.abs(diff.as("minutes")) < 60) {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("minutes")))}m${postfix}`;
    } else if (Math.abs(diff.as("hours")) < 24) {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("hours")))}h${postfix}`;
    } else if (Math.abs(diff.as("days")) < 30) {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("days")))}d${postfix}`;
    } else if (Math.abs(diff.as("months")) < 12) {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("months")))}mo${postfix}`;
    } else {
        deltaDisplay = `${suffix}${Math.round(Math.abs(diff.as("years")))}y${postfix}`;
    }

    return deltaDisplay;
}

export function formatDate(dateTimeStr, options = { delta: false, absolute: true }) {
    const absolute = options.absolute ? formatAbsoluteDate(dateTimeStr) : "";
    const delta = options.delta ? formatDeltaDate(dateTimeStr) : "";

    if (options.delta && options.absolute) {
        return `${delta} (${absolute})`;
    } else if (options.delta) {
        return delta;
    } else {
        return absolute;
    }
}
