import { PlusCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command.jsx"

function AccountFilter() {
  const { data, error, isLoading } = useAccountData();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircleIcon size={16} className='mr-1'/>
          Account
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start'>
        {!isLoading && !error &&
          <Command>
            <CommandInput placeholder="Search for account ..."/>
            <CommandList>
              <CommandEmpty>No account found :</CommandEmpty>
              <CommandGroup heading='Accounts'>
                {Object.keys(data).map(accountId => (
                  <CommandItem key={accountId} onSelect={() => console.log('selecting item')}>{accountId}</CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        }
      </PopoverContent>
    </Popover>
  )
}

export default AccountFilter;