import { PlusCircleIcon, ChevronDown } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function AccountFilter() {
  const { data, error, isLoading } = useAccountData();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8'>
          <div className="flex flex-row gap-2 items-center">
            Account
            <ChevronDown size={16} className='mr-1' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start'>
        <div className="text-xs">

          <Select>
          <SelectTrigger className="border-0 text-xs mb-3 w-auto inline-flex">
              <SelectValue placeholder="Is any of" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="any">Is any of</SelectItem>
              <SelectItem value="all">Is all of</SelectItem>
              <SelectItem value="isblank">Is Blank</SelectItem>
              <SelectItem value="isnotblank">Is Not Blank</SelectItem>
            </SelectContent>
          </Select>

          {!isLoading && !error &&
            <Command>
              <CommandInput placeholder="Search for account ..." />
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
        </div>

      </PopoverContent>
    </Popover>
  )
}

export default AccountFilter;