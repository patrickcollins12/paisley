SELECT * 
FROM (
        SELECT 
        t.id,
        t.datetime,
        t.account,

        t.description as orig_description,
        te.description as revised_description,
        
        CASE
        WHEN te.description NOT NULL AND te.description != '' THEN 
            te.description
        ELSE
            t.description
        END AS description,

        t.credit,
        t.debit,
        CASE
            WHEN t.debit != '' AND t.debit > 0.0 THEN -t.debit
            WHEN t.credit != '' AND t.credit > 0.0 THEN t.credit
            ELSE 0.0
        END AS amount,
        t.balance,
        t.type,

        /* tags */
        CASE
            WHEN t.tags = '' OR t.tags IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE t.tags
        END AS auto_tags,
        CASE
            WHEN te.tags = '' OR te.tags IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE te.tags
        END AS manual_tags,


        /* party */
        CASE
            WHEN t.party = '' OR t.party IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE t.party
        END AS auto_party,
        CASE
            WHEN te.party = '' OR te.party IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE te.party
        END AS manual_party,
		

        te.auto_categorize 
        FROM 'transaction' t
        LEFT JOIN 'transaction_enriched' te ON t.id = te.id
    ) AS main
WHERE 1=1
 ORDER BY datetime DESC LIMIT 100.0 OFFSET 0.0

