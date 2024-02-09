const config = require('./Config');
let rules = require(config['rules']);

let newRules = {}
for (const [rule, categories] of Object.entries(rules)) {
    let ruleParts = rule.split(/\s*;\s*/)
    newRules[rule] = {}
    newRules[rule]['replacements'] = []

    newRules[rule]['categories'] = {'from':categories, 'to':categories}
    newRules[rule]['newRule'] = rule
    // newRules[rule]['ruleParts'] = []
    
    for (const rulePart of ruleParts){
        let [x,y] = rulePart.split(/\s*:\s*/);
        newRules[rule]['replacements'].push( {from:y, to:y})

        // let arr = tokenize(y)
        // let dict = []
        // for (const tok of arr ){
        //     dict.push({[tok]:tok})
        // }
        // console.log(dict)
        // newRules[rule]['ruleParts'].push( {tokens: dict } )
    }
}

console.log(JSON.stringify(newRules))
// console.log("module.exports = ")
// console.dir(newRules, {depth:null});

// const tokens = tokenize("Hello, bob's thi.* am?a?zn tes.?t is a\\b airtasker\\* random Guzman|\\bGYG\\b message_with_underscore!")
// // console.log(tokens);

// function tokenize(str) {
//     var regexRegex = /([\w.?*]+)|(\\\w)|([.*!|<>^]+)/g;
//     return str.match(regexRegex);
// }
