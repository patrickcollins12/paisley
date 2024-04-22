const minimist = require('minimist');

// load command line arguments
const args = minimist(process.argv);

if (!args['db']) {
    console.error('Error: No database file specified. Use the --db option to specify the database path.');
    process.exit(1);  // Exit with a non-zero status code to indicate an error
}

const count = args['c'] || 100;

console.log("DB: ", args['db'])
const Database = require('better-sqlite3');
const db = new Database(args['db']);
// const db = new Database(args['db'], { verbose: console.log });
// SELECT json_each.value 
//                FROM transaction_enriched, json_each(transaction_enriched.tags)
//                WHERE json_valid(transaction_enriched.tags);


const query2 = `

               SELECT json_each.value 
               FROM 'transaction' t, json_each(t.tags) 
               WHERE json_valid(t.tags)
               
               UNION
               
               SELECT json_each.value 
               FROM transaction_enriched, json_each(transaction_enriched.tags) 
               WHERE json_valid(transaction_enriched.tags);
               `;

const query = `
SELECT 
t.id,
t.datetime,
t.account,

t.description as description,
te.description as revised_description,

t.credit,
t.debit,

CASE
  WHEN t.debit != '' AND t.debit > 0.0 THEN  -t.debit
  WHEN t.credit != '' AND t.credit > 0.0 THEN  t.credit
  ELSE 0.0
END AS amount,

t.balance,
t.type,

CASE
    WHEN t.tags = '' OR t.tags IS NULL THEN ''
    ELSE t.tags
END AS tags,

te.tags AS manual_tags,
te.auto_categorize 
FROM 'transaction' t
LEFT JOIN 'transaction_enriched' te ON t.id = te.id
WHERE 1=1
AND (t.description LIKE '%young%' OR t.tags LIKE '%young%' OR te.tags LIKE '%young%')
ORDER BY datetime DESC LIMIT 100.0 OFFSET 0.0

`;

function measurePerformance(query, numberOfExecutions) {
    let timings = [];

    for (let i = 0; i < numberOfExecutions; i++) {
        const start = process.hrtime.bigint();
        const result = db.prepare(query).all();
        const end = process.hrtime.bigint();

        // Convert nanoseconds to milliseconds
        const duration = Number(end - start) / 1000000;
        timings.push(duration);
        // console.log(`Execution ${i + 1}: ${duration.toFixed(2)} ms`);
    }

    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    const avgTime = timings.reduce((acc, cur) => acc + cur, 0) / timings.length;

    console.log(`\nMinimum Time: ${minTime.toFixed(2)} ms`);
    console.log(`Maximum Time: ${maxTime.toFixed(2)} ms`);
    console.log(`Average Time: ${avgTime.toFixed(2)} ms`);
    console.log(`Count: ${numberOfExecutions}`);

}

measurePerformance(query, count);
