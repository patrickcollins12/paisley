// const re = /(\w+)\s(\w+)/;
// const str = "Maria Cruz";
// const newstr = str.replace(re, "$2, $1");
// console.log(newstr); // Cruz, Maria

const { DateTime } = require("luxon");

const re = /(DEBIT CARD PURCHASE\s*)/g;
const str = "foo bar DEBIT CARD PURCHASE aliexpress Melbourne    AUS";

console.log("og -->" + str);
let newstr
newstr = str.replace(re, "$`"); console.log("$` -->" + JSON.stringify(newstr,null,"\t"));
newstr = str.replace(re, "$'"); console.log("$' -->" + JSON.stringify(newstr,null,"\t"));
newstr = str.replace(re, ""); console.log("\"\" -->" + JSON.stringify(newstr,null,"\t"));

let re2 = RegExp(/(\d\d?):(\d\d)([AP]M) (\d\d?)(\w{3})\b/,"i")
let str2 = 'blah 05:04PM 27Jul h'
let match = str2.match(re2)
if (match) {
    let [full,hr,min,ampm,date,month]=match    
    let str3 = `${month} ${parseInt(date)}, 2024, ${parseInt(hr)}:${min} ${ampm}`

    // console.log(str2)
    // console.log(str3)
    let dt = DateTime.fromFormat(str3, "ff", {zone:"Australia/West" })

    console.log(dt.toString())

}
