# TODO
- [ ] do tests for in and not in lists. try it with tags, party and account.
- [ ] do tests for regex/contains on lists like tags, party and account.
- [ ] Once and for all fix ReactSelect and make it the new class on Rules, Transactions and the Filter. Make it a new class created for the Account Toolbar panel. Let's make that the standard for everything as it has some nice abstractions including options for coloredPills and isCreatable.
- [ ] Add string (contains/regex) to Account Filter
- [ ] Editable input is saving on blur even when nothing has changed (15m)
- [x] Add new operators to the rules backend. isblank, notisblank, isedited. done.
       - abs(number)- [x] Rule creator on the frontend. Design it.
- [x] Start abstracting, move the Filter Button out as a separate component to centralize it.
- [x] Change columns to use ghost button
- [x] Account Filter is saving on load: "Saving: isFilterActive: false, pickerMode: "is", selectedOptions: []" (15m)
- [x] Add onKeyDown escape propagates all the way up to close the popover (30m)


tags in ['a','b'] => 
tags empty        =>      (manual_tags = '' [] null) and (auto_tags = '' [] null)
tags not_empty    => NOT ((manual_tags = '' [] null) and (auto_tags = '' [] null))
tags contains transfer => (manual_tags = like '%transfer%') OR (auto_tags like '%transfer%')
