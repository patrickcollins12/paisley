 # Querying Transactions
```
/rule='description REGEX /amazon/i' <-- see rule patterns
OR
/filter='description REGEX /amazon/i' <-- same as rule patterns

/ruleid=4       <-- load a rule and filter the transactions based on this rule


```

 # Rules
Each rule is designed to match a series of transactions and automatically attach the tags and party.
These rules can be constructed from the UI and saved in the database.
The /transactions end point can filter itself by a rule or ruleid

```
example rules:
description = /ama?zo?n/i         <-- will be case sensitive unless i modifier is applied.
description = /\bpharmac\b/i      <-- \b is helpful for matching on word boundaries
description = /FU *REPORT/i       <-- match zero or more spaces
description = 'amazon'            <-- LIKE '%amazon%' (always does a partial match)
description <> 'amazon'           <-- NOT LIKE '%amazon%' (always does a partial match)
description > 30                  <-- >, >=, <, <=
(description = 'st vin de paul' OR description = 'st vincent de paul')
                                  <-- complex grouping is supported in rules
description starts with 'amazon'  <-- LIKE 'amazon%'

```

 # JSON:API Filters documentation on /transactions endpoint
```
&filter[description]="exact string"
&filter[description][startsWith]=Employer
&filter[description][endsWith]="bye"
&filter[description][contains]="partial string"
&filter[tags][0]=Tag>1
&filter[tags][1]=Tag>2
&filter[tags][is null]=
&filter[tags][is not null]=
&filter[party][in][0]=Bunnings
&filter[party][in][1]=Kmart
&filter[date][>=]=2023-03-01
&filter[date][<=>]=2023-03-31
&filter[amount][=]=50 OR just &filter[amount]=50
&filter[amount][>]=50
&filter[amount][>=]=100
&filter[amount][abs=]=50
&filter[amount][abs>]=50
&filter[amount][abs>=]=100
```

## valid filter fields on /transaction
```
description,type             strings
tags, manual_tags, auto_tags json lookups
party, account               lookups
debit,credit,amount,balance  numerics
datetime                     dates
all                          used for general search across most text fields: 
                               "description", "revised_description", "tags","manual_tags", "type", "party"
```
## valid operators

### numerics and dates
these operators work on numerics and dates
```
>=
>      
<
<=            
=             
<>         
empty
not empty
```

prepend `abs` to use the absolute of value, e.g. `filter[amount][abs>]=10`.

examples:
```
filter[amount][>]=10
filter[amount][abs>]=10 # searches >10 or <-10 ignoring the sign
filter[amount][=]=10
filter[amount]=10
filter[amount][empty]=  # searches for null and '', but won't match 0
```

to search between two dates or numerics, add two filters as follows and use `<=`, `>=` not `<` and `>`.  most people assume you'll include the dates in question when searching between two dates.
```
filter[amount][>=]='2024-01-01' 
filter[amount][<=]='2024-03-01' 
```

### strings
```
=             performs a = 'val' where query
contains      performs a like '%val%' where query <-- always default
startswith    performs a like 'val%' where query
endswith      performs a like '%val' where query
regex         /test?/ is case sensitive /test?/i is case insensitive
empty         performs query: is null or field = ''
```

prepend `not_` to use the opposite, e.g. `filter[description][not_contains]=bunnings`.
examples:
```
filter[description][contains]=amazon
filter[description][regex]=\bama?zo?n\b     # finds amazon amazn or amzn but only as whole words anywhere in the string
filter[description][not_regex]='\bama?zo?n\b' # finds amazon amazn or amzn but only as whole words anywhere in the string
filter[description][not_empty]=
filter[description][empty]=
```

### lists
valid lists: `manual_tags`, `auto_tags` or `tags` (both)

```
in            performs query: field in ['a', 'b']
empty         performs query: is null or field = ''
not empty     performs query: is null or field = ''
```

prepend `not_` to use the opposite, e.g. `filter[description][not_contains]=bunnings`.
examples:
```
filter[tags][contains]='amazon'
filter[tags][regex]='\bama?zo?n\b'     # finds amazon amazn or amzn but only as whole words anywhere in the string
filter[tags][not_regex]='\bama?zo?n\b' # finds amazon amazn or amzn but only as whole words anywhere in the string
filter[tags][in][0]='Transfers'
filter[tags][in][1]='Misc > Reimbursements'
filter[tags][not_empty]=
filter[tags][empty]=
filter[party][not_empty]=
filter[party][empty]=
```


## notes on the backend

 - `Or` groups are not supported. Filtering does not currently allow OR filter groups, like: `"A and (B OR C)"`. if needed, please raise a request.
 - "tags" filtering will always search "auto" tags and also "manual" tags concurrently
 - "description" filtering will always search "original" description and "revised" description.
 - "between" does not exist on the backend, because it is easy to emulate on the frontend. 
    x between 1 and 2, simply becomes `filter[field][>=]=1&filter[field][<=]=2`

 # Toolbar Design - specifications
``` 
v Search
  [               ] <- searches everything. 

Advanced or Filter button rolls down more options
v Description
  [               ]

v Accounts
  [Filter...]
  [ ] account a
  [x] account b
  [x] account c
  [ ] account d

v Tags
  [contains]    [keyword]
  [starts with] [keyword]
  [is empty]
  [is all of]   [filter select: [x] choice a, [ ] choice b]
  [is any of]   [filter select: [x] choice a, [ ] choice b]
  [is not]      [filter select: [x] choice a, [ ] choice b]

v Party
  same as Tags above

v All time
  Past week
  Past month
  Past quarter
  Past year
  Between [ ] [ ]
  Custom range...

v Amount
  [Amount] is [greater than] [ ]
  [Amount] is [less than]    [ ]
  [Credit]    [equals]       [ ]
  [Credit]    [between]      [ ] and [ ]
  [Debit ]    [less than]    [ ]
  [x] ignoring +/- <-- this option is important and should be checked by default. 
                       why? most people don't care about the direciton, just the amount. 
                       Add the abs modifier to the filter operator.
                       It will do where query abs(val) <= amt_val
                       filter[field][abs<=]=amt_val
```

