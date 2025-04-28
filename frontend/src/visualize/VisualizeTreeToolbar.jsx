import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";

export const defaultVisualizeTreeOptions = {
    headingLevel: 3,
    incomeEnabled: false,
    expenseEnabled: true,
};

export function VisualizeTreeToolbar({ options, setOptions }) {
    // Destructure all options from the options object
    const {
        headingLevel,
        incomeEnabled,
        expenseEnabled
    } = options;

    // Helper functions to update individual options
    const updateOption = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex items-center gap-6">

            {/* Tag level selector */}
            <div className="flex items-center">
                <Select
                    value={headingLevel.toString()}
                    onValueChange={(value) => updateOption('headingLevel', parseInt(value))}
                >
                    <SelectTrigger className="h-9 font-semibold dark:bg-input/30">
                        <SelectValue placeholder="Select a tag level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">No headings</SelectItem>
                        <SelectItem value="1">Top Level Headings only</SelectItem>
                        <SelectItem value="2">Headings to tag L1</SelectItem>
                        <SelectItem value="3">Headings to tag L1 {`>`} L2</SelectItem>
                        <SelectItem value="4">Headings to tag L1 {`>`} L2 {`>`} L3</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Income/Expense Filters */}
            <div className="flex items-center gap-0">
                <Button
                    variant={incomeEnabled ? 'selected' : 'outline'}
                    size="sm"
                    className="rounded-none rounded-l-md border-r-0"
                    onClick={() => updateOption('incomeEnabled', !incomeEnabled)}
                >
                    <TrendingUp className="h-4 w-4" />

                    <span className="text-xs">Income</span>
                </Button>
                <Button
                    variant={expenseEnabled ? 'selected' : 'outline'}
                    size="sm"
                    className="rounded-none rounded-r-md"
                    onClick={() => updateOption('expenseEnabled', !expenseEnabled)}
                >
                    <TrendingDown className="h-4 w-4" />

                    {/* <TrendingDown className="h-4 w-4" /> */}
                    <span className="text-xs">Expense</span>
                </Button>
            </div>
        </div>
    );
} 