MOVED TO AIRTABLE

<!-- 
# TODO
 - [ ] Tags 
    - [ ] Tags Editor. Editor dropdown panel with "Disable auto tagging". Show edited tag and auto tag.
    - [ ] Create Rule.
 - [ ] Make the Description editable: https://tanstack.com/table/latest/docs/framework/react/examples/editable-data
 - [ ] Rename this to be frontend
 - [x] Grid cleanup - reduce font size, try to avoid wrapping. 

 - [ ] Better info display:
    - [ ] Display dates more succinctly. Human readable. Today, Yesterday, Feb 12, Feb 13, etc. Make them adapt to timezone.
    - [ ] Add an amount formatter depending on the currency. console.log((2500).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' } )); ￥2,500. https://stackoverflow.com/questions/673905/how-can-i-determine-a-users-locale-within-the-browser
    - [ ] Add currency to amounts when the currency is not your default. e.g. if my default is AUD, then a USD amount will add USD.
    - [x] Hover over for account info rather than display all account info.
    - [x] Embed orig_description underneath "description" with smaller lighter italics. Design needed.
    - [x] nbsp's on accounts

 - [ ] Allow as many features on the grid as possible:
    - [ ] column ordering https://tanstack.com/table/latest/docs/framework/react/examples/column-ordering
    - [ ] column resizing https://tanstack.com/table/latest/docs/framework/react/examples/column-sizing
    - [ ] showing/hiding columns. like hide account. show amount, hide credit/debit.
    - [ ] sorting by column
    - [ ] group by date. group by account?
 - [ ] More Filters.
    - [ ] Date Range Picker: https://ui.shadcn.com/docs/components/date-picker#date-range-picker
    - [ ] Amount Filter: from [0] to []... basic less,greater,between. NOTE: that this will use the absolute [amount] where amount is +credit/-debit. So +500 credit and -500 debit will both appear in a 450-550 search
    - [ ] 
 - Create "Amount" which is (-credit OR debit)... compute on backend or frontend?
 
  -->