import { DateTime } from "luxon";

// Map: dateGroupKey -> Map<tag, { sum: number, transactions: Array<{ dt: DateTime, amount: number, description: string }> }>
function processRow(row, dateGroups, allTags, timeGrouping, tagLevel, incomeEnabled, expenseEnabled) {
  // Normalize tags
  row.tags = row.tags?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
  if (row.tags.length === 0) row.tags.push("Uncategorized");

  // Normalize party
  row.party = row.party?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
  if (row.party.length === 0) row.party.push("Uncategorized");

  // Process the tag to the specified level
  const amount = parseFloat(row.amount) || 0;

  // Skip this transaction if it's income and income is disabled, or if it's an expense and expenses are disabled
  const isIncome = amount > 0;
  if ((isIncome && !incomeEnabled) || (!isIncome && !expenseEnabled)) {
    return;
  }

  // Handle the case where timeGrouping is still 'auto' or invalid
  let safeTimeGrouping = timeGrouping;
  if (timeGrouping === 'auto' || !['day', 'week', 'month', 'quarter'].includes(timeGrouping)) {
    safeTimeGrouping = 'day';
  }

  // Format the date according to grouping
  const date = DateTime.fromISO(row.datetime);
  let datetime;

  if (safeTimeGrouping === "day") {
    datetime = date.toFormat("yyyy-MM-dd");
  } else if (safeTimeGrouping === "week") {
    datetime = date.startOf("week").plus({ days: 6 }).toFormat("yyyy-MM-dd");
  } else if (safeTimeGrouping === "month") {
    datetime = date.startOf("month").toFormat("yyyy-MM");
  } else if (safeTimeGrouping === "quarter") {
    const quarter = Math.ceil(date.month / 3);
    datetime = `${date.year}-Q${quarter}`;
  } else {
    // Fix the error message termination
    throw new Error(`Invalid time grouping: ${safeTimeGrouping}`);
  }

  // Determine tag and category based on amount sign
  let tag = row.tags[0] || "Uncategorized";
  let segments = tag.split(/\s*>\s*/);

  // Prepend Income/Expense prefix based on amount
  if (amount > 0) {
    segments.unshift("Income");
  } else {
    segments.unshift("Expense");
  }

  // Limit the tag to the specified level
  const tagToUse = segments.slice(0, Math.min(tagLevel, segments.length)).join(" > ");

  // Initialize the date group if it doesn't exist
  if (!dateGroups.has(datetime)) {
    dateGroups.set(datetime, new Map());
  }

  // Get the current tag map for this date
  const tagMap = dateGroups.get(datetime);

  // Ensure the entry for the tag exists with the new structure
  if (!tagMap.has(tagToUse)) {
      // Initialize with sum and an empty transactions array
      tagMap.set(tagToUse, { sum: 0, transactions: [] });
  }

  // Get the data object for this tag
  const tagData = tagMap.get(tagToUse);

  // Calculate value to add based on income/expense filtering
  let valueToAdd;
  if (incomeEnabled && !expenseEnabled && isIncome) valueToAdd = amount;
  else valueToAdd = -amount; // Typically show expenses as positive bars/lines

  tagData.sum += valueToAdd;

  // Store transaction details instead of just the date
  const dt = DateTime.fromISO(row.datetime);
  if (dt.isValid) {
      tagData.transactions.push({
          dt: dt, // Keep the DateTime object
          id: row.id, // Pass the transaction ID for stable keys
          amount: parseFloat(row.amount) || 0, // Store the original amount
          description: row.description || '' // Store the description
      });
  }

  // Add the tag to our set of all tags
  allTags.add(tagToUse);
}

export function turnTransactionQueryIntoLineChartStructure(data, groupBy = "day", tagLevel = 2, incomeEnabled = true, expenseEnabled = true) {
  const dateGroups = new Map();
  const allTags = new Set();
  const effectiveGroupBy = groupBy;

  data.forEach(row => {
    processRow(row, dateGroups, allTags, effectiveGroupBy, tagLevel, incomeEnabled, expenseEnabled);
  });

  // Generate display dates
  const displayDates = [];
  const sortedGroupKeys = Array.from(dateGroups.keys()).sort();

  // Just populate displayDates
  sortedGroupKeys.forEach(groupKey => {
      displayDates.push(groupKey);
  });

  // Create series data using displayDates order
  const series = Array.from(allTags).map(tag => ({
    name: tag,
    data: displayDates.map(displayDate => {
      const groupData = dateGroups.get(displayDate);
      const tagData = groupData?.get(tag);
      return tagData ? tagData.sum : 0; // Use the aggregated sum
    })
  }));

  // Return display dates, the grouped data map, and series data
  // Note: dateGroups now contains the transaction details needed for the tooltip
  return { displayDates, dateGroups, series };
}

// Helper function to calculate the appropriate grouping for the given data range
export function calculateEffectiveGrouping(data) {
  // Handle empty data case
  if (!data || data.length === 0) {
    return "day"; // Default to day if no data
  }

  // Find min and max dates by sorting the data
  const sortedDates = data
    .map(row => DateTime.fromISO(row.datetime))
    .filter(date => date.isValid)
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (sortedDates.length === 0) {
    return "day"; // Default to day if no valid dates
  }

  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  const diffInDays = maxDate.diff(minDate, "days").days;

  if (diffInDays > 365 * 1.5) {
    return "quarter";
  } else if (diffInDays > 9 * 30) {
    return "month";
  } else if (diffInDays > 2 * 30) {
    return "week";
  } else {
    return "day";
  }
} 