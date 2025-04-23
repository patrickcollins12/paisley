import React, { useState, useEffect, useRef } from "react";
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
echarts.use([TooltipComponent, LineChart, DatasetComponent, CanvasRenderer]);

// import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";

export default function VisualizeTrend() {
  const searchContext = useSearch();
  const [option, setOption] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef(null);
  const theme = useResolvedTheme();

  const { data, isLoading, error } = useFetchTransactions({
    pageIndex: 0,
    // pageSize: 1000, // unlimited page size
    pagingDisabled: true,
    filters: searchContext.getFilters(),
    orderBy: null,
  });

  const activeSeriesIndexRef = useRef(null);

  // Dynamically update chart size
  const updateSize = () => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const h = window.innerHeight - rect.top - 10
      const w = window.innerWidth - rect.left - 10
      // console.log("updateSize", h, w)

      setDimensions({ height: h, width: w });
    }
  };


  useEffect(() => {
    updateSize(); // Initial sizing on mount
    window.addEventListener("resize", updateSize); // Resize listener
    return () => window.removeEventListener("resize", updateSize); // Cleanup
  }, []);

  // Update the the ref to current series index on mouseover a series
  const onChartReady = (chart) => {
    window.chartInstance = chart;

    chart.on('mouseover', (params) => {
      activeSeriesIndexRef.current = params?.seriesIndex;
    });
  };

  // when hovering over the graph a white tooltip pops up, this is how it is formatted
  function tooltipFormatter(infoArr) {
    // Get date from first item
    const date = infoArr[0]?.axisValue || '';

    // Build tooltip content
    let content = `<div style="margin-bottom:5px;font-weight:bold">${date}</div>`;

    // Get active series index from ref
    const currentActiveSeriesIndex = activeSeriesIndexRef.current;

    // Add each non-zero data item
    content += infoArr
      .filter(info => info.value !== 0)
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .map(info => {
        // Check if this is the active series
        const isActive = info.seriesIndex === currentActiveSeriesIndex;

        const content = `
          <div style="display:flex;justify-content:space-between;margin:3px 0">
            <span>${info.marker} ${info.seriesName}</span>
            <span style="margin-left:15px;">${formatCurrency(info.value)}</span>
          </div>
          `;

        return isActive ? `<strong>${content}</strong>` : content;
      })
      .join('');

    return content;
  }


  // setup the chart options
  useEffect(() => {
    if (data && data.results) {
      const chartData = turnTransactionQueryIntoLineChartStructure(data.results, "month", 2);

      setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          confine: true,
          formatter: tooltipFormatter
        },

        // todo
        valueFormatter: (value) => '$' + value.toFixed(2),

        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: chartData.dates
          }
        ],

        yAxis: [
          {
            type: 'value'
          }
        ],

        series: chartData.series.map(s => ({
          name: s.name,
          type: 'line',
          // stack: 'Total',
          areaStyle: {},
          triggerLineEvent: true,
          emphasis: { focus: 'series' },
          data: s.data
        })),

      });
    }
  }, [data]);


  return (
    <>
      <Toolbar />

      {isLoading && <div>Loading transactions...</div>}
      {error && <div>Error loading transactions: {error.message}</div>}
      {!isLoading && !error && (!data || !data.results) && (
        <div>No data available</div>
      )}

      <div
        ref={chartRef}
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="overflow-auto"
      >

        {!isLoading && !error && data && option && (
          <ReactEChartsCore
            echarts={echarts}
            ref={chartRef}
            option={option}
            lazyUpdate={true}
            style={{ width: "100%", height: "100%" }}
            theme={{ theme }}
            onChartReady={onChartReady}

          />
        )}
      </div>

    </>
  );


  // call as follows:
  // const series = turnTransactionQueryIntoLineChartStructure(data.results, "day");
  function turnTransactionQueryIntoLineChartStructure(data, groupBy = "day", tagLevel = 2) {
    // Create data structures to hold our grouped data
    const dateGroups = new Map(); // Map of date -> tag -> sum
    const allTags = new Set(); // To track all unique tags at the specified level

    // Process each transaction row
    data.forEach(row => {
      // Process the transaction using a helper function
      processRow(row, dateGroups, allTags, groupBy, tagLevel);
    });

    // Extract sorted unique dates for the x-axis
    const dates = Array.from(dateGroups.keys()).sort();

    // Create series structure required for charts
    const series = Array.from(allTags).map(tag => ({
      name: tag,
      data: dates.map(date => {
        const tagData = dateGroups.get(date);
        return tagData && tagData.has(tag) ? tagData.get(tag) : 0;
      })
    }))

    // Return structure that matches how it's used in the component
    return { dates, series }

  }

  function processRow(row, dateGroups, allTags, timeGrouping, tagLevel) {
    // Normalize tags
    row.tags = row.tags?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.tags.length === 0) row.tags.push("Uncategorized");

    // Normalize party
    row.party = row.party?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.party.length === 0) row.party.push("Uncategorized");

    // Format the date according to grouping
    const date = DateTime.fromISO(row.datetime);
    let datetime;

    if (timeGrouping === "day") {
      datetime = date.toFormat("yyyy-MM-dd");
    } else if (timeGrouping === "week") {
      datetime = date.startOf("week").plus({ days: 6 }).toFormat("yyyy-MM-dd");
    } else if (timeGrouping === "month") {
      datetime = date.startOf("month").toFormat("yyyy-MM");
    } else if (timeGrouping === "quarter") {
      const quarter = Math.ceil(date.month / 3);
      datetime = `${date.year}-Q${quarter}`;
    } else {
      throw new Error(`Invalid time grouping: ${timeGrouping}`);
    }

    // Process the tag to the specified level
    const amount = parseFloat(row.amount) || 0;

    // Determine tag and category based on amount sign
    let tag = row.tags[0] || "Uncategorized"
    let segments = tag.split(/\s*>\s*/)

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

    // Add the amount to the current value for this tag (or initialize it)
    const currentValue = tagMap.has(tagToUse) ? tagMap.get(tagToUse) : 0;
    tagMap.set(tagToUse, currentValue + (-amount));

    // Add the tag to our set of all tags
    allTags.add(tagToUse);
  }

}
