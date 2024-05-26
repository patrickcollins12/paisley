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


const query = `

SELECT * 
FROM (
        SELECT 
        t.id,
        t.datetime,
        t.account,
        t.description as description,
        te.description as revised_description,
        CASE
            WHEN te.description NOT NULL AND te.description != '' THEN 
                te.description
            ELSE
                t.description
        END AS new_description
        t.credit,
        t.debit,
        CASE
            WHEN t.debit != '' AND t.debit > 0.0 THEN -t.debit
            WHEN t.credit != '' AND t.credit > 0.0 THEN t.credit
            ELSE 0.0
        END AS amount,
        t.balance,
        t.type,
        CASE
            WHEN t.tags = '' OR t.tags IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE t.tags
        END AS auto_tags,
        CASE
            WHEN te.tags = '' OR te.tags IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE te.tags
        END AS manual_tags,
        te.auto_categorize 
        FROM 'transaction' t
        LEFT JOIN 'transaction_enriched' te ON t.id = te.id
    ) AS main
WHERE 1=1
 AND ((auto_tags IS NULL OR auto_tags = '' OR auto_tags = '[]'))
 AND ((manual_tags IS NOT NULL AND manual_tags <> '' AND manual_tags <> '[]'))
 ORDER BY datetime

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
