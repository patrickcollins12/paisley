const W = require('./csv_parsers/westpac.js');
const w = new W()
console.log(w)
console.log(w.matchesFileName('testfilefwestpac'));
console.log(w.toUTC('2003-12-23'));

