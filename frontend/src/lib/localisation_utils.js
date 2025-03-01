import { DateTime } from 'luxon'


export function formatCurrency(value) {
    if (typeof value !== "number") return "$0.00"; // Ensure proper fallback

    const absValue = Math.abs(value).toFixed(2); // Always ensure two decimal places
    const formattedValue = absValue.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas manually

    return value < 0 ? `-$${formattedValue}` : `$${formattedValue}`;
}

export function formatDate(dateTimeStr) {
    var dateDisplay;

    var t = DateTime.fromISO(dateTimeStr)

    // if date is today
    const today = DateTime.now()
    const yesterday = DateTime.now().plus({ days: -1 })
    if (t.hasSame(today, "day")) {
        dateDisplay = "Today"
    }

    // if date is yesterday
    else if (t.hasSame(yesterday, "day")) {
        dateDisplay = "Yesterday"
    }

    else {
        // print 23 Mar
        dateDisplay = t.toFormat("d MMM")

        // print 23 Mar 2024
        if (t.year !== DateTime.now().year) {
            dateDisplay += t.toFormat(" yyyy")
        }
    }

    return dateDisplay
}
