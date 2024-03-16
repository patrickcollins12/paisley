- learn react properly.
- add documentation 
    - Docusaurus
    - https://github.com/Redocly/redoc 
    - Slate is ok, maybe with widdershins?
- add new api end points
    - [ ] add a date range filter to /transactions
    - [ ] add an "amount" filter to /transactions
- [ ] handle rule components: "rule: last-only"


DONE
    - [O] rewrite /date to filter_field=[description|tags]&filter_val=chatswood&filter_strategy=[starts_with,ends_with,contains,does_not_contain,is_greater_than]. DROPPED
    - [x] swagger-jsdoc auto generate.
    - [x] add paging to /data 
    - [x] add filters to /data: description, tags
    - [x] add order by to /data
    - [x] /data returns enriched cats too
    - [x] move the routes to their own directory
    - [x] update transaction categories, pass id and 1 or more cats