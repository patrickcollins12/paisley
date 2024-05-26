import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { DateTime } from 'luxon'

export function DateTimeDisplay({ account, datetime }) {
  const { data: accounts, error, isLoading } = useAccountData();

  //   const handleRefreshClick = () => {
  //     refreshAccounts(); // Call this function to refresh the accounts data
  // };

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error}</p>;

  // get the browser timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // format the date
  var t = DateTime.fromISO(datetime)

  var dateDisplay;
  // is midnight
  // if (t.minute == 0 && t.hour == 0 && t.second == 0) {
  //   dateDisplay = t.toFormat("d MMM yyyy")
  // } else {
  //   if (t.second == 0) {
  //     dateDisplay = t.toFormat("d MMM yyyy t")
  //   } else {
  //     dateDisplay = t.toFormat("d MMM yyyy tt")
  //   }
  // }

  // if date is today
  const today = DateTime.now()
  const yesterday = DateTime.now().plus({ days: -1 })
  if (t.hasSame(today, "day")) {
    dateDisplay = "Today"
  } 

  // if date is yesterday
  else if (t.hasSame(yesterday, "day")) {
    dateDisplay = "Yesterday"
  } 
  
  else {
    // print 23 Mar
    dateDisplay = t.toFormat("d MMM")

    if (t.year !== DateTime.now().year) {
      dateDisplay += t.toFormat(" yyyy")
    }
  }

  const acct = isLoading ? {} : (accounts[account] ?? {});

  // const date = formatDate(datetime)
  const hc = (
    <HoverCardContent align="start">
      {/* <HoverCardArrow /> */}
      {acct ? (
        <div>
          <p>{datetime}</p>
          <p>Timezone: {acct.timezone}</p>
          <p>TZ of browser: {tz}</p>
        </div>
      ) : (
        <div>no account data</div>
      )}

    </HoverCardContent>
  );

  return (
    <HoverCard>
      {/* <HoverCard openDelay="0" closeDelay="0"> */}
      <HoverCardTrigger asChild>
        {/* <Button variant="rawlink"> */}
        <a href="#" className="whitespace-nowrap">
          <p>{dateDisplay}</p>
        </a>
        {/* </Button> */}
      </HoverCardTrigger>
      {hc}
    </HoverCard>);
}