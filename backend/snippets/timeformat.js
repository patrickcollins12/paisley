const { DateTime } = require('luxon');

function formatDate(dateStr) {
  // Parse the incoming date string with its original timezone
  const incomingDate = DateTime.fromISO(dateStr);

  // Dynamically determine the system's timezone
  const systemTimeZone = DateTime.local().zoneName;

  // Get the current date in the system's timezone
  const currentDate = DateTime.now().setZone(systemTimeZone);

  // Format date depending on whether it's in the current year
  let dateFormat = incomingDate.year === currentDate.year ? 'LLL dd' : 'LLL dd yyyy';

  // Check if the time is exactly midnight
  const isMidnight = incomingDate.hour === 0 && incomingDate.minute === 0 && incomingDate.second === 0;

  // Format the date according to the requirements
  let formattedDate = incomingDate.toFormat(dateFormat);

  // Check timezone and midnight conditions
  if (!isMidnight) {
    // If not midnight, add time (omitting milliseconds and seconds)
    formattedDate += ' ' + incomingDate.toFormat('HH:mm');
  }

  // Append the original timezone if it's different from the system's timezone and if it's the same as the system's timezone at the corresponding period
  if (incomingDate.offsetNameShort !== DateTime.now().setZone(incomingDate.zone).offsetNameShort) {
    formattedDate += ' ' + incomingDate.toFormat('Z');
  }

  return formattedDate;
}

// Example usage
console.log(formatDate("2024-02-17T00:00:00+1100")); // Should return "Feb 17" assuming the system's timezone is AEDT
console.log(formatDate("2023-07-17T00:00:00+1000")); // Should return "Jul 17 2023" assuming the system's timezone is AEST
console.log(formatDate("2023-07-17T00:00:00+0900")); // Should return "Jul 17 2023 +0900"
