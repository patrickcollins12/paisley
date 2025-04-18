import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { Skeleton } from "@/components/ui/skeleton.jsx"
import AccountIcon from '@/icons/AccountIcon.jsx';

export function AccountDisplay({account, display}) {
  const {data, error, isLoading} = useAccountData(account);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a className='flex items-center space-x-1.5 text-xs font-normal hover:cursor-pointer'>
          <AccountIcon
            institution={data?.institution || display}
            type={data?.type}
            className="shrink-0 w-4 h-4 p-0 m-0 mr-2 border-none"
            logoClassName="w-4 h-4"
            iconSize={16}
          />
          <span>{display}</span>
        </a>
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
          <div className="flex items-center space-x-3">
            <AccountIcon institution={data.institution} type={data.type} className="shrink-0" />
            <div className="text-sm">
              <h4 className="font-semibold">{data.institution}</h4>
              <p className="text-muted-foreground">{data.name}</p>
              <p className="text-muted-foreground text-xs">Type: {data.type}</p>
              <p className="text-muted-foreground text-xs">Holder(s): {data.holders}</p>
              <p className="text-muted-foreground text-xs">Currency: {data.currency}</p>
              <p className="text-muted-foreground text-xs">Timezone: {data.timezone}</p>
            </div>
          </div>
        }
        {!data && !isLoading &&
          <p>No details found :(</p>
        }
      </HoverCardContent>
    </HoverCard>
  )
}