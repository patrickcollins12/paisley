SELECT distinct(id)
                        FROM "transaction"
                        WHERE 
                        EXISTS (
                            SELECT 1
                            FROM json_each(json_extract(tags, '$.rule'))
                            WHERE json_each.value = 282 
                        )
                        OR
                        EXISTS (
                            SELECT 1
                            FROM json_each(json_extract(party, '$.party'))
                            WHERE json_each.value = 282 
                        );
