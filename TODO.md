# TODO
- [ ] Change all uses of useAccountData to use an array not an indexed object, to maintain the sort state
- [ ] why is \bWORD\b not working?
- [ ] Add a backend filter for "All" in transactions filter
- [ ] Simon: enable column resizing and save column state https://tanstack.com/table/v8/docs/api/features/column-sizing#state
- [ ] Simon: Sync url with filters
- [ ] Simon: Add "Create rule" from description filter, start with: description = 'assad', description = /assad/i
- [ ] Add string (contains/regex) to Account Filter
- [ ] do tests for regex/contains on lists like tags, party and account.

# PROJECTS
- Define hooks on import and classify
- Docs:
- Create Install process
- Finish Accounts
- Create a Reporting System








- [x] Bug: update_transaction auth handler is locking. fix it.
- [x] Bug: Editable input is saving on blur even when nothing has changed (15m)
- [x] Ruleedit needs some helper text temporarily
- [o] Ruledit needs a save button?
- [x] applyRule(txids) not working see TODO
- [x] New rules system, fix TQF tests for blank/not_blank and fix why party isn't filitering correctly on the frontend.
- [x] do tests for in and not in lists. try it with tags, party and account.
- [x] Bug: a faulty rule shouldn't halt the rerun_classifier. Fix the throw/catch
- [x] Bug: Tags needs to merge sets properly on autocat select/deselect.
- [x] Bug: fix transaction column filter: Account_name
- [x] Bug: badges aren't applying correctly on frontend
- [o] Bug: tag list is sometimes half loaded (can't repro)
- [x] Add new operators to the rules backend. isblank, notisblank, isedited. done.
       - abs(number)- [x] Rule creator on the frontend. Design it.
- [x] Start abstracting, move the Filter Button out as a separate component to centralize it.
- [x] Change columns to use ghost button
- [x] Account Filter is saving on load: "Saving: isFilterActive: false, pickerMode: "is", selectedOptions: []" (15m)
- [x] Add onKeyDown escape propagates all the way up to close the popover (30m)
- [x] Once and for all fix ReactSelect and make it the new class on Rules, Transactions and the Filter. Make it a new class created for the Account Toolbar panel. Let's make that the standard for everything as it has some nice abstractions including options for coloredPills and isCreatable.

