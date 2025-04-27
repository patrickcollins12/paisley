import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Layers, BarChart3, LineChart as LineChartIcon, ChartColumn } from "lucide-react";

export function VisualizeTrendToolbar({ options, setOptions }) {
    // Destructure all options from the options object
    const {
        timeGrouping,
        effectiveTimeGrouping,
        chartType,
        isStacked,
        tagLevel,
        incomeEnabled,
        expenseEnabled
    } = options;

    // Helper functions to update individual options
    const updateOption = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    // When in auto mode, we highlight the effective button but clicking still sets the exact mode
    const isAutoMode = timeGrouping === 'auto';
    const displayedTimeGrouping = isAutoMode ? effectiveTimeGrouping : timeGrouping;

    return (
        <div className="flex items-center gap-6">
            {/* Time grouping buttons */}
            <div className="flex items-center">
                <Button
                    variant={timeGrouping === 'auto' ? 'selected' : 'outline'}
                    className="rounded-none rounded-l-md border-r-0"
                    onClick={() => updateOption('timeGrouping', 'auto')}
                >
                    Auto
                </Button>
                <Button
                    variant={displayedTimeGrouping === 'day' ? (isAutoMode ? 'outline' : 'selected') : 'outline'}
                    className={`rounded-none border-r-0 ${displayedTimeGrouping === 'day' && isAutoMode ? 'dark:bg-black' : ''}`}
                    onClick={() => updateOption('timeGrouping', 'day')}
                >
                    Day
                </Button>
                <Button
                    variant={displayedTimeGrouping === 'week' ? (isAutoMode ? 'outline' : 'selected') : 'outline'}
                    className={`rounded-none border-r-0 ${displayedTimeGrouping === 'week' && isAutoMode ? 'dark:bg-black' : ''}`}
                    onClick={() => updateOption('timeGrouping', 'week')}
                >
                    Week
                </Button>
                <Button
                    variant={displayedTimeGrouping === 'month' ? (isAutoMode ? 'outline' : 'selected') : 'outline'}
                    className={`rounded-none border-r-0 ${displayedTimeGrouping === 'month' && isAutoMode ? 'dark:bg-black' : ''}`}
                    onClick={() => updateOption('timeGrouping', 'month')}
                >
                    Month
                </Button>
                <Button
                    variant={displayedTimeGrouping === 'quarter' ? (isAutoMode ? 'outline' : 'selected') : 'outline'}
                    className={`rounded-none rounded-r-md ${displayedTimeGrouping === 'quarter' && isAutoMode ? 'dark:bg-black' : ''}`}
                    onClick={() => updateOption('timeGrouping', 'quarter')}
                >
                    Quarter
                </Button>
            </div>

            {/* Chart type selector (Bar/Line) */}
            <div className="flex items-center">
                <Button
                    variant={chartType === 'line' ? 'selected' : 'outline'}
                    className="rounded-none rounded-l-md border-r-0"
                    onClick={() => updateOption('chartType', 'line')}
                >
                    <LineChartIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant={chartType === 'bar' ? 'selected' : 'outline'}
                    className="rounded-none rounded-r-md"
                    onClick={() => updateOption('chartType', 'bar')}
                >
                    <BarChart3 className="h-4 w-4" />
                </Button>
            </div>

            {/* Stacked mode enable/disable */}
            <div className="flex items-center">
                <Button
                    variant="outline"
                    className="rounded-md flex items-center gap-2"
                    onClick={() => updateOption('isStacked', !isStacked)}
                >
                    {isStacked ? <Layers className="h-6 w-6" /> : <BarChart3 className="h-6 w-6" />}
                    <span className="text-xs">{isStacked ? 'Stacked' : 'Unstacked'}</span>
                </Button>
            </div>

            {/* Tag level selector */}
            <div className="flex items-center">
                <Select
                    value={tagLevel}
                    onValueChange={(value) => updateOption('tagLevel', value)}
                >
                    <SelectTrigger className="h-9 dark:bg-input/30">
                        <SelectValue placeholder="Select a tag level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">L1</SelectItem>
                        <SelectItem value="2">L1 {`>`} L2</SelectItem>
                        <SelectItem value="3">L1 {`>`} L2 {`>`} L3</SelectItem>
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
                    {/* <TrendingUp className="h-4 w-4" /> */}
                    <ChartColumn className="h-4 w-4 -scale-y-100"/>
                    <span className="text-xs">Income</span>
                </Button>
                <Button
                    variant={expenseEnabled ? 'selected' : 'outline'}
                    size="sm"
                    className="rounded-none rounded-r-md"
                    onClick={() => updateOption('expenseEnabled', !expenseEnabled)}
                >
                    <ChartColumn className="h-4 w-4"/>
                    {/* <TrendingDown className="h-4 w-4" /> */}
                    <span className="text-xs">Expense</span>
                </Button>
            </div>
        </div>
    );
} 