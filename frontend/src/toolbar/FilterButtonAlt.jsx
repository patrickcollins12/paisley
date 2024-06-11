import React, { Children, useState } from "react"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"

export function FilterButtonAlt({ active, onClear, children }) {
  const labelComponent = Children.toArray(children).find(x => x.type === FilterButtonAltLabel);
  const contentComponet = Children.toArray(children).find(x => x.type === FilterButtonAltContent);

  const [isOpen, setIsOpen] = useState(false);

  function buttonLabel() {
    if (!active) {
      return (
        <span className="inline-flex gap-2 pr-2 items-center">
          {labelComponent}
          <ChevronDown size={16} />
        </span>
      )
    }

    return (
      <>
        {labelComponent}
        <TooltipProvider defaultOpen delayDuration={1200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onClear} className="p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
                  <X size={16} />
              </span>
            </TooltipTrigger>
            <TooltipContent className="border-0 bg-slate-700 text-white font-normal p-4" side="bottom">
              <p>Remove this filter</p>
              <TooltipArrow className="fill-slate-700"></TooltipArrow>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant={active ? "selected" : "ghost"}
          className="h-8 pl-3 pr-0 py-3 justify-start text-left font-normal">
          <div className="flex flex-row font-semibold items-center">
            {buttonLabel()}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className="w-auto">
        {contentComponet}
      </PopoverContent>
    </Popover>
  )
}

export function FilterButtonAltLabel({ children }) {
  return (
    <>{children}</>
  )
}

export function FilterButtonAltContent({ children }) {
  return (
    <>{children}</>
  )
}