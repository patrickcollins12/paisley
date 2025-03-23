import { DateTime } from 'luxon';


// Get list of all available timezones
const timezones = DateTime.local().setZone('UTC').zoneName;

console.log(timezones);
