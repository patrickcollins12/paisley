const { DateTime } = require('luxon');
var t = DateTime.fromISO("2024-03-28T00:00:00.000+11:00");

// var z = t.setZone("America/Los_Angeles");

console.log(`${t.toISO()}[${t.zoneName}]`)

console.log(`${t.toFormat("d MMM yyyy")} ${t.offsetNameShort}`)

console.log(`${t.toISO({suppressMilliseconds:true,suppressSeconds:true,includeOffset:false})}[${t.zoneName}]`)