export function formatCurrency(value) {
    if (typeof value !== "number") return "$0.00"; // Ensure proper fallback

    const absValue = Math.abs(value).toFixed(2); // Always ensure two decimal places
    const formattedValue = absValue.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas manually

    return value < 0 ? `-$${formattedValue}` : `$${formattedValue}`;
}
