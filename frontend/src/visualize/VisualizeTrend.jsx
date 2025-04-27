import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { useResolvedTheme } from "@/components/theme-provider";
import { DateTime } from "luxon";

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, DatasetComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { VisualizeTrendToolbar } from "./VisualizeTrendToolbar.jsx";
import { TrendTooltipContent } from "./TrendTooltipContent.jsx";
import { useTrendTooltip } from "./useTrendTooltip.js"; // Import the custom hook

echarts.use([TooltipComponent, LineChart, DatasetComponent, CanvasRenderer]);

// import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";

export default function VisualizeTrend() {
  const searchContext = useSearch();
  const [option, setOption] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [chartOptions, setChartOptions] = useState({
    timeGrouping: 'auto',
    effectiveTimeGrouping: 'day', // Default until auto-detection runs
    chartType: 'bar',
    isStacked: true,
    tagLevel: "2",
    incomeEnabled: false,
    expenseEnabled: true
  });

  const containerRef = useRef(null); // Ref for the sizing container div
  const chartRef = useRef(null); // Ref for the ECharts component instance
  const theme = useResolvedTheme();

  // Pass the grouped data map (dateGroups) to the tooltip hook
  // We need to store dateGroups in state so the hook can access it
  const [dateGroupsForTooltip, setDateGroupsForTooltip] = useState(null);
  const tooltip = useTrendTooltip(chartRef, dateGroupsForTooltip);

  const { data, isLoading, error } = useFetchTransactions({
    pageIndex: 0,
    pagingDisabled: true,
    filters: searchContext.getFilters(),
    orderBy: null,
  });

  // Create a key that changes when either data or filters change
  const chartInstanceKey = `${data?.results?.length ?? 0}-${JSON.stringify(searchContext.getFilters())}`;

  // Dynamically update chart size based on the container div
  const updateSize = () => {
    if (containerRef.current) { // Use containerRef here
      const rect = containerRef.current.getBoundingClientRect(); // Get container's position
      const h = window.innerHeight - rect.top - 10;
      const w = window.innerWidth - rect.left - 10;
      setDimensions({ height: h, width: w });
    }
  };

  useEffect(() => {
    // Need to wait for containerRef to be populated
    if (containerRef.current) { // Check containerRef here
        updateSize(); // Initial sizing on mount
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    } else {
        // If container not ready, retry slightly later (less common now)
        const timeoutId = setTimeout(updateSize, 100);
        return () => clearTimeout(timeoutId);
    }
    // Depend on the ref itself - effect reruns when ref is attached
  }, [containerRef.current]);

  // Extract only the options we need for the chart to prevent unnecessary rerenders
  const { timeGrouping, chartType, isStacked, tagLevel, incomeEnabled, expenseEnabled } = chartOptions;

  // Keep track of the effective time grouping without causing render loops
  const [calculatedGrouping, setCalculatedGrouping] = useState('day');

  // Handle auto time grouping calculation
  useEffect(() => {
    if (data?.results) {
      if (timeGrouping === 'auto') {
        const grouping = calculateEffectiveGrouping(data.results);
        setCalculatedGrouping(grouping);
      } else {
        setCalculatedGrouping(timeGrouping);
      }
    }
  }, [data, timeGrouping]);

  // Update the options with the effective grouping
  useEffect(() => {
    if (calculatedGrouping && calculatedGrouping !== chartOptions.effectiveTimeGrouping) {
      setChartOptions(prev => ({
        ...prev,
        effectiveTimeGrouping: calculatedGrouping
      }));
    }
  }, [calculatedGrouping, chartOptions.effectiveTimeGrouping]);

  // setup the chart options
  useEffect(() => {
    if (data?.results) {
      const effectiveGrouping = timeGrouping === 'auto' ? calculatedGrouping : timeGrouping;
      if (effectiveGrouping && effectiveGrouping !== 'auto') {
        // Get chart data and the grouped transaction data
        const { displayDates, dateGroups, series } = turnTransactionQueryIntoLineChartStructure(
          data.results,
          effectiveGrouping,
          parseInt(tagLevel, 10),
          incomeEnabled,
          expenseEnabled
        );

        // Store the dateGroups map in state for the tooltip hook to use
        setDateGroupsForTooltip(dateGroups);

        setOption({
          tooltip: {
            trigger: 'item',
            showContent: false,
          },
          valueFormatter: (value) => '$' + value.toFixed(2),
          xAxis: [
            {
              type: 'category',
              boundaryGap: false,
              data: displayDates // Use the display dates for the axis
            }
          ],
          yAxis: [
            {
              type: 'value'
            }
          ],
          series: series.map(s => ({ // Use the processed series data
            name: s.name,
            type: chartType,
            stack: isStacked ? 'Total' : undefined,
            areaStyle: {},
            triggerLineEvent: true,
            emphasis: { focus: 'series' },
            data: s.data
          })),
        });
      }
    }
  }, [data, timeGrouping, chartType, isStacked, tagLevel, incomeEnabled, expenseEnabled, calculatedGrouping]);

  return (
    <>
      <Toolbar />

      <div className="flex justify-center py-2">
        <VisualizeTrendToolbar
          options={chartOptions}
          setOptions={setChartOptions}
        />
      </div>

      {isLoading && <div>Loading transactions...</div>}
      {error && <div>Error loading transactions: {error.message}</div>}
      {!isLoading && !error && (!data || !data.results) && (
        <div>No data available</div>
      )}


      <div
        ref={containerRef} // Attach containerRef here
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="overflow-auto"
      >
        {!isLoading && !error && data && option && (
          <ReactEChartsCore
            echarts={echarts}
            ref={chartRef} // Keep chartRef here for the hook
            option={option}
            lazyUpdate={false}
            notMerge={true}
            style={{ width: "100%", height: "100%" }}
            theme={{ theme }}
            key={chartInstanceKey}
          />
        )}
      </div>

      {/* Portal for Custom React Tooltip - Use values from hook */}
      {tooltip.isTooltipVisible && tooltip.tooltipInfo && createPortal(
        <div
          ref={tooltip.tooltipRef} // Use ref from hook
          style={{ position: 'absolute', left: `${tooltip.finalTooltipPosition.x}px`, top: `${tooltip.finalTooltipPosition.y}px`, pointerEvents: 'none', zIndex: 9999 }}
        >
          <TrendTooltipContent
            displayDate={tooltip.tooltipInfo.displayDate}
            seriesName={tooltip.tooltipInfo.seriesName}
            seriesValue={tooltip.tooltipInfo.seriesValue}
            transactions={tooltip.tooltipInfo.transactions}
          />
        </div>,
        document.body
      )}
    </>
  );

  // Restore data processing functions with original comments

  // call as follows:
  // const series = turnTransactionQueryIntoLineChartStructure(data.results, "day");
  function turnTransactionQueryIntoLineChartStructure(data, groupBy = "day", tagLevel = 2, incomeEnabled = true, expenseEnabled = true) {
    // Map: dateGroupKey -> Map<tag, { sum: number, transactions: Array<{ dt: DateTime, amount: number, description: string }> }>
    const dateGroups = new Map();
    const allTags = new Set();
    const effectiveGroupBy = groupBy;

    data.forEach(row => {
      processRow(row, dateGroups, allTags, effectiveGroupBy, tagLevel, incomeEnabled, expenseEnabled);
    });

    // Generate display dates
    const displayDates = [];
    const sortedGroupKeys = Array.from(dateGroups.keys()).sort();

    // Just populate displayDates
    sortedGroupKeys.forEach(groupKey => {
        displayDates.push(groupKey);
    });


    // Create series data using displayDates order
    const series = Array.from(allTags).map(tag => ({
      name: tag,
      data: displayDates.map(displayDate => {
        const groupData = dateGroups.get(displayDate);
        const tagData = groupData?.get(tag);
        return tagData ? tagData.sum : 0; // Use the aggregated sum
      })
    }));

    // Return display dates, the grouped data map, and series data
    // Note: dateGroups now contains the transaction details needed for the tooltip
    return { displayDates, dateGroups, series };
  }

  function processRow(row, dateGroups, allTags, timeGrouping, tagLevel, incomeEnabled, expenseEnabled) {
    // Normalize tags
    row.tags = row.tags?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.tags.length === 0) row.tags.push("Uncategorized");

    // Normalize party
    row.party = row.party?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.party.length === 0) row.party.push("Uncategorized");

    // Process the tag to the specified level
    const amount = parseFloat(row.amount) || 0;

    // Skip this transaction if it's income and income is disabled, or if it's an expense and expenses are disabled
    const isIncome = amount > 0;
    if ((isIncome && !incomeEnabled) || (!isIncome && !expenseEnabled)) {
      return;
    }

    // Handle the case where timeGrouping is still 'auto' or invalid
    let safeTimeGrouping = timeGrouping;
    if (timeGrouping === 'auto' || !['day', 'week', 'month', 'quarter'].includes(timeGrouping)) {
      safeTimeGrouping = 'day';
    }

    // Format the date according to grouping
    const date = DateTime.fromISO(row.datetime);
    let datetime;

    if (safeTimeGrouping === "day") {
      datetime = date.toFormat("yyyy-MM-dd");
    } else if (safeTimeGrouping === "week") {
      datetime = date.startOf("week").plus({ days: 6 }).toFormat("yyyy-MM-dd");
    } else if (safeTimeGrouping === "month") {
      datetime = date.startOf("month").toFormat("yyyy-MM");
    } else if (safeTimeGrouping === "quarter") {
      const quarter = Math.ceil(date.month / 3);
      datetime = `${date.year}-Q${quarter}`;
    } else {
      // Fix the error message termination
      throw new Error(`Invalid time grouping: ${safeTimeGrouping}`);
    }

    // Determine tag and category based on amount sign
    let tag = row.tags[0] || "Uncategorized";
    let segments = tag.split(/\s*>\s*/);

    // Prepend Income/Expense prefix based on amount
    if (amount > 0) {
      segments.unshift("Income");
    } else {
      segments.unshift("Expense");
    }

    // Limit the tag to the specified level
    const tagToUse = segments.slice(0, Math.min(tagLevel, segments.length)).join(" > ");

    // Initialize the date group if it doesn't exist
    if (!dateGroups.has(datetime)) {
      dateGroups.set(datetime, new Map());
    }

    // Get the current tag map for this date
    const tagMap = dateGroups.get(datetime);

    // Ensure the entry for the tag exists with the new structure
    if (!tagMap.has(tagToUse)) {
        // Initialize with sum and an empty transactions array
        tagMap.set(tagToUse, { sum: 0, transactions: [] });
    }

    // Get the data object for this tag
    const tagData = tagMap.get(tagToUse);

    // Calculate value to add based on income/expense filtering
    let valueToAdd;
    if (incomeEnabled && !expenseEnabled && isIncome) valueToAdd = amount;
    else valueToAdd = -amount; // Typically show expenses as positive bars/lines

    tagData.sum += valueToAdd;

    // Store transaction details instead of just the date
    const dt = DateTime.fromISO(row.datetime);
    if (dt.isValid) {
        tagData.transactions.push({
            dt: dt, // Keep the DateTime object
            amount: parseFloat(row.amount) || 0, // Store the original amount
            description: row.description || '' // Store the description
        });
    }

    // Add the tag to our set of all tags
    allTags.add(tagToUse);
  }

  // Helper function to calculate the appropriate grouping for the given data range
  function calculateEffectiveGrouping(data) {
    // Handle empty data case
    if (!data || data.length === 0) {
      return "day"; // Default to day if no data
    }

    // Find min and max dates by sorting the data
    const sortedDates = data
      .map(row => DateTime.fromISO(row.datetime))
      .filter(date => date.isValid)
      .sort((a, b) => a.valueOf() - b.valueOf());

    if (sortedDates.length === 0) {
      return "day"; // Default to day if no valid dates
    }

    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    const diffInDays = maxDate.diff(minDate, "days").days;

    if (diffInDays > 365 * 1.5) {
      return "quarter";
    } else if (diffInDays > 9 * 30) {
      return "month";
    } else if (diffInDays > 2 * 30) {
      return "week";
    } else {
      return "day";
    }
  }
}