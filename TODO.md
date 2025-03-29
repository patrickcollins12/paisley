# TODO
p1
[ ] install - demo DB data account logos. make the dates fresh?
[x] install - bring demo DB up to date

p2
[ ] install - create a jwt key on install
[ ] install - fix/finish install script

p3
[ ] accounts table - add currency.js route conversion to accounts page
[ ] account page - manually add a balance amount
[ ] paisley backend on beelink. feels pretty important!?
[ ] visualize page - set default filters
[ ] visualize page - add some options: group by party, first tag, all tags (double count)
[ ] build a default currency chooser, default is currently based on locale and accounts currencies.

One day:
[ ] pull paisley scraper/collector out into a separate project. separate git repo?
[ ] alter rules engine to allow s// of description, or do we just do this in the parser
[ ] Finish migrating to config.json5 (Allows us to specify an alternate csv_parser location and use python to load the config file)
[ ] Change all uses of useAccountData to use an array not an indexed object, to maintain the sort state
[ ] Add kv logging for events. Events could include playwright runs, failures, logins.
[ ] Simon: enable  column resizing and save column state https://tanstack.com/table/v8/docs/api/features/column-sizing#state
[ ] Simon: Sync url with filters
[ ] Simon: Add "Create rule" from description filter, start with: description = 'assad', description = /assad/i


done
[x] accounts table - option to show inactive accounts
[x] account page - edit / control the edit options (asset/liability, currency:AUD/USD/etc, iconned banks)
[x] account page - edit / add ?'s to the fields to describe them
[x] account page - layout better with recent always on the right.
[x] accounts page - create account work, but minor bug on RHF not playing nice with ReactSelect when a defaultValue is set... 
[x] account page can now edit
[x] git detached?
[x] wire up account_edit/:id to the account page
[x] account page - add account details
[x] accounts page - default logo
[x] account page - add active/inactive status
[x] account page - make back button work from accounts page
[x] account page - edit account details (scraper def?). review what belongs on account table vs config vs code
[x] account page - has a section to link to sub accounts
[x] account page - account total works
[x] accounts table - Sub accounts details on the accounts page… > v
[x] accounts page - SparkLine can handle account totals - min is max min date of all rows and vice versa
[x] account page - can graph sub accounts
       almost done. the interpolate function is returning series which the balancechart needs to pickup.
       the backend needs to emulate the interpolate function's structure
[x] account page - graph needs to reduce width in mobile mode (needs a useRef and detect mobile mode)
[x] accounts table - consolidate on Intl.NumberFormat
[x] account page - show interest amount and chart
[x] account page - add $ to main categories
[x] accounts table - consolidate utils 
[x] improved logging: change console.log-->logger.info on the server, parsers, importers and classifiers
[x] accounts table - add a sparkline (react-sparklines or chartist.js offer simpler, more minimal designs)
[x] accounts table - table is too wide. add institution to the table but hide it
[x] accounts table - update all relevant scrapers to get the balance from the homescreen (chase, commsec, bankwest)
[x] - react-i18nnext auto-detects language: https://react.i18next.com/
[x] - Intl.NumberFormat().resolvedOptions().locale => en-AU
[x] - Default currency en-AU => AU => AUD (https://github.com/tadeegan/locale-currency)
[x] New bar graph: transactions per day. Modify account_history route to also give transaction count per day:
       SELECT t.account, DATE(t.datetime) AS dt, t.balance, count(*) AS cnt FROM 'transaction' t WHERE t.account = '302985 1360851' GROUP BY DATE(datetime) ORDER BY dt DESC
[x] "Last updated" date human readable --> Today 00:30am AEST
[x] where to source logo for each account? where to store that?
[x] design the account page with new and editing, use the sexy graph format from Ben's app
[x] add account graph page. [list|graph]
[x] get max date from child accounts
[x] first draft implementation done
[x] make api keys file optional ApiKeyManager.js
[x] cutover coinbase to use util.savetopaisley
[x] check and delete the old swyftx balances from transactions
[x] cutover rest from csv to account/balance
[x] npm run serve should do both frontend and backend
[x] implement logging
[x] cutover swyftx and rest to use account history api.
[x] Add rules to the dropdown
[x] Add filter_save to the backend as kv pair
[x] Maybe balances go to events as well? (WON'T DO)
[x] Add string (contains/regex) to Account/Tags/Party Filter, do tests too (WON'T DO)

# PROJECTS

Replace Playwright with undetected

Define hooks on import and classify
       Examples: 
       Add tags/party from CSV import
       Add an additional classifier that is sole or additional.
       Scheduled enricher
     
DB Migrator, prism? knexjs? https://knexjs.org/guide/migrations.html#migration-api

Docs
       Document how to create a scraper and a CSV importer
       
Create Install process
       Setup default demo database
       explore docker up

[x] Playwright
       [x] Invoked from backend instead with node-cron and a * * * in config.js. Remove pm2
       [x] Write a wrapper and try/catch? Invoke playwright directly?

[x] Finish Accounts
     [x] Accounts screen with balances

[x] Reports
       Design the Account Screen as a report
       Balance Reporting over time

Closed bugs/tickets
[x] /rules returns # of matching transactions
[x] why is \bWORD\b not working?
[x] Add a backend filter for "All" in transactions filter
[x] What to do with "BAL"? I think when we implement layered filters, this is a default off.
[x] Bug: update_transaction auth handler is locking. fix it.
[x] Bug: Editable input is saving on blur even when nothing has changed (15m)
[x] Ruleedit needs some helper text temporarily
[o] Ruledit needs a save button?
[x] applyRule(txids) not working see TODO
[x] New rules system, fix TQF tests for blank/not_blank and fix why party isn't filitering correctly on the frontend.
[x] do tests for in and not in lists. try it with tags, party and account.
[x] Bug: a faulty rule shouldn't halt the rerun_classifier. Fix the throw/catch
[x] Bug: Tags needs to merge sets properly on autocat select/deselect.
[x] Bug: fix transaction column filter: Account_name
[x] Bug: badges aren't applying correctly on frontend
[o] Bug: tag list is sometimes half loaded (can't repro)
[x] Add new operators to the rules backend. isblank, notisblank, isedited. done.
       abs(number)[x] Rule creator on the frontend. Design it.
[x] Start abstracting, move the Filter Button out as a separate component to centralize it.
[x] Change columns to use ghost button
[x] Account Filter is saving on load: "Saving: isFilterActive: false, pickerMode: "is", selectedOptions: []" (15m)
[x] Add onKeyDown escape propagates all the way up to close the popover (30m)
[x] Once and for all fix ReactSelect and make it the new class on Rules, Transactions and the Filter. Make it a new class created for the Account Toolbar panel. Let's make that the standard for everything as it has some nice abstractions including options for coloredPills and isCreatable.
[x] add treemap to visualize page
       [x] if party exists, show that, else show description
       [x] try to get rid of the title space at the top
       [x] compare it to the old system
       [x] kill the backend script?
       [x] get the width and height correctly
       [x] turn off paging 
       [x] see if we can use TransactionQuery from VisualizePage, and move the tree hierarchy creation to the frontend
       [x] add echarts to the frontend
       [x] generate the backend script




Currency popup

Default currency|v|
AUD A$123 (3 accounts)
USD $123USD (1 account)
GBP £123
---
AUD
...
ZIM

Settings Menu

How to display currency|v|
[ ] Show currency symbols sparingly (recommended)
[ ] Convert all values to my default currency
[ ] Always display currency symbols. Best if you have a lot of transactions in multiple currencies.
[ ] Never show currency symbols (will still be available in amount tooltips)

Summing multiple currencies. 

Summing on the net worth report:
[various]
Tool tip:
Currency conversion service is unavailable. Consider [adding a currency converter].
Subtotals by Currency
    AUD: A$X
    USD: $Y
    GBP: £Z


$490
Tool tip:
Subtotals by Currency
    AUD: $300 (.69 12/23/2024)
    USD: $50 (.69 12/23/2024)
    GBP: £50 (.69 12/23/2024)
Approximate total based on cached conversion rates as of [date/time].
