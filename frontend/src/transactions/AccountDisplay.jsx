import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { Skeleton } from "@/components/ui/skeleton.jsx"

export function AccountDisplay({account}) {
  const {data, error, isLoading} = useAccountData(account);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a className='text-xs font-normal hover:cursor-pointer'>{account}</a>
      </HoverCardTrigger>
      <HoverCardContent align="start">
        {isLoading &&
          <div className='space-y-1'>
            <Skeleton className='h-4 w-full'/>
            <Skeleton className='h-4 w-1/4'/>
            <Skeleton className='h-4 w-1/2'/>
          </div>
        }
        {data &&
          <div>
            <h4>{data.institution}</h4>
            <p>{data.name}</p>
            <p>Account holder(s): {data.holders}</p>
            <p>Currency: {data.currency}</p>
            <p>Type: {data.type}</p>
            <p>Timezone: {data.timezone}</p>
          </div>
        }
        {!data &&
          <p>No details found :(</p>
        }
      </HoverCardContent>
    </HoverCard>
  )
}