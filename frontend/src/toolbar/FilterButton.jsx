import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronDown, X } from "lucide-react";

const FilterButton = forwardRef(({ isFilterActive, label, onClear, activeRenderer }, ref) => {
    return (
        <Button
            id={label} size='sm'
            variant={isFilterActive ? "selected" : "ghost"}
            className="h-8 pl-3 pr-0 py-3 justify-start text-left font-normal"
            ref={ref}>
            <div className="flex flex-row font-semibold items-center">
                {isFilterActive ? (
                    <>
                        {activeRenderer(label)}
                        <TooltipProvider defaultOpen delayDuration={1200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span onClick={onClear} className="p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white">
                                        <X size={16} />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="border-0 bg-slate-700 text-white font-normal p-4" side="bottom">
                                    <p>Remove this filter</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </>
                ) : (
                    <span className="inline-flex gap-2 pr-2 items-center">
                        {label}
                        <ChevronDown size={16} />
                    </span>
                )}
            </div>
        </Button>
    );
});

export default FilterButton;
