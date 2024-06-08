import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { Button } from "@/components/ui/button.jsx"
import { PlusCircleIcon, ChevronDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command.jsx"
import { useFetchTags } from "@/tags/TagApiHooks.js"

function TagsFilter() {

  const { data: tags, error, isLoading } = useFetchTags("tags");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8'>
          <div className="flex flex-row gap-2 items-center">
            Tags
            <ChevronDown size={16} className='mr-1' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-1' align='start'>
        {!isLoading && !error &&
          <Command>
            <CommandInput placeholder="Search for tag ..." />
            <CommandList>
              <CommandEmpty>No tags found :</CommandEmpty>
              <CommandGroup heading='Tags'>
                {tags.map(tag => (
                  <CommandItem key={tag} onSelect={() => console.log('selecting item')}>{tag}</CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        }
      </PopoverContent>
    </Popover>
  )
}

export default TagsFilter;