import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { formatDate } from "@/lib/localisation_utils.js";

export function DateTimeDisplay({ account, datetime }) {
  const { data: accounts, error, isLoading } = useAccountData();

  // get the browser timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // format the date
  const dateDisplay = formatDate(datetime)


  const acct = isLoading ? {} : (accounts[account] ?? {});

  const hc = (
    <HoverCardContent align="start">
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