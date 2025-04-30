import { DateTime } from 'luxon'
import i18n from "i18next";


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
        dateDisplay = i18n.t("Today");
    } else if (t.hasSame(yesterday, "day")) {
        dateDisplay = i18n.t("Yesterday");
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

/**
 * Formats a DateTime object or ISO string for display on charts.
 * Shows date as "dd MMM yyyy". Appends the timezone offset (e.g., GMT-7, UTC)
 * if and only if the input date's effective timezone offset differs
 * from the browser's local timezone offset at that specific instant.
 * @param {import("luxon").DateTime | string} dtOrIsoString - The Luxon DateTime object or an ISO 8601 string.
 * @returns {string} Formatted date string.
 */
export function formatChartDate(dtOrIsoString) {
    let dt;
    if (typeof dtOrIsoString === 'string') {
        // Use setZone: true to preserve IANA zone if possible,
        // use fixed offset if present, or default to local if no info.
        dt = DateTime.fromISO(dtOrIsoString, { setZone: true });
    } else {
        dt = dtOrIsoString; // Assume it's already a DateTime object
    }

    if (!dt || !dt.isValid) return ""; // Basic validation

    // Format the date part first
    let dateDisplay = dt.toFormat("dd MMM yyyy HH:mm");

    // Get the browser's local zone object
    const localZone = DateTime.local().zone;
    // Get the zone object from the parsed/input DateTime
    const inputZone = dt.zone;

    // Calculate the offset in minutes for both zones AT THE SPECIFIC INSTANT of the date (dt.ts)
    // This correctly handles DST transitions for IANA zones.
    const inputOffsetMinutes = inputZone.offset(dt.ts);
    const localOffsetMinutesAtInstant = localZone.offset(dt.ts);

    // Append timezone offset string only if the effective offsets are different
    if (inputOffsetMinutes !== localOffsetMinutesAtInstant) {
        // ZZZZ format gives GMT+/-HH:mm or UTC
        dateDisplay += ` (${dt.toFormat("z")})`;
    }

    return dateDisplay;
}
