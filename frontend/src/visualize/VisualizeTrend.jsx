import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { useResolvedTheme } from "@/components/theme-provider";

import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, DatasetComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import { VisualizeTrendToolbar } from "./VisualizeTrendToolbar.jsx";
import { TrendTooltipContent } from "./TrendTooltipContent.jsx";
import { useTrendTooltip } from "./useTrendTooltip.js"; // Import the custom hook

// Import utility functions
import {
  turnTransactionQueryIntoLineChartStructure,
  calculateEffectiveGrouping
} from './trendChartUtils.js';

echarts.use([TooltipComponent, LineChart, DatasetComponent, CanvasRenderer]);


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

  // Handle auto time grouping calculation - USES IMPORTED FUNCTION
  useEffect(() => {
    if (data?.results) {
      if (timeGrouping === 'auto') {
        // Use the imported calculateEffectiveGrouping function
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

  // setup the chart options - USES IMPORTED FUNCTION
  useEffect(() => {
    if (data?.results) {
      const effectiveGrouping = timeGrouping === 'auto' ? calculatedGrouping : timeGrouping;
      if (effectiveGrouping && effectiveGrouping !== 'auto') {
        // Use the imported turnTransactionQueryIntoLineChartStructure function
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
              boundaryGap: true,
              data: displayDates // Use the display dates for the axis
            }
          ],
          yAxis: [
            {
              type: 'value',
              scale: true,
              splitNumber: 15,
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
}