import React, { useState, useEffect, useRef } from "react";
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { useResolvedTheme } from "@/components/theme-provider";
import { DateTime } from "luxon";
import { VisualizeTreeToolbar } from "./VisualizeTreeToolbar.jsx";
import { defaultVisualizeTreeOptions } from './VisualizeTreeToolbar.jsx';
import { turnTransactionQueryIntoTreemapStucture } from "./treeChartUtils.js";


// import ReactECharts from "echarts-for-react";
// import { graphic, format } from 'echarts';

// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core';

// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import {
  // TreeChart,
  TreemapChart
} from 'echarts/charts';

import {
  TooltipComponent,
  DatasetComponent,
} from 'echarts/components';

import {
  CanvasRenderer,
  // SVGRenderer,
} from 'echarts/renderers';

// const { LinearGradient } = graphic;
echarts.use(
  [TooltipComponent, TreemapChart, DatasetComponent, CanvasRenderer]
);

// import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";

export default function VisualizeTree() {
  const searchContext = useSearch();
  const [option, setOption] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef(null);
  const theme = useResolvedTheme();
  const [treeOptions, setTreeOptions] = useState(defaultVisualizeTreeOptions);

  // Extract only the options we need for the chart to prevent unnecessary rerenders
  const { incomeEnabled, expenseEnabled, headingLevel } = treeOptions;

  const { data, isLoading, error } = useFetchTransactions({
    pageIndex: 0,
    // pageSize: 1000, // unlimited page size
    pagingDisabled: true,
    filters: searchContext.getFilters(),
    orderBy: null,
  });

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

  // add $ to the tooltip
  function formatUpperLabel(info) {

    return `${info.name} ${formatCurrency(info.value, { style: "decimal", maximumFractionDigits: 0 })} `;
  }

  useEffect(() => {
    if (data && data.results) {

      const tree = turnTransactionQueryIntoTreemapStucture(data.results, incomeEnabled, expenseEnabled);

      setOption({

        tooltip: {
          formatter: function (info) {
            const treePath = info.treePathInfo
              .slice(1)
              .map((item) => item.name);

            // Get the top level amount and percentage
            let percentage = ""
            try {
              const topLevelAmount = info.treePathInfo[1].value;
              percentage = ((info.value / topLevelAmount) * 100).toFixed(1);
              percentage = `${percentage}%`
            } catch (e) { }

            let txnStr = "";
            if (info.data?.description) {
              treePath.pop();
              txnStr = `<div>
                        <div>${info.data.description}</div>
                        <div>${info.data.date}</div>
                        <div>Party: ${info.data.partyString}</div>
                        <div>${info.data.account_shortname} (${info.data.account_number})</div>
                        </div>`;
            }

            const treePathStr = treePath.join(" > ");
            // <div class="tooltip-title">${format.encodeHTML(treePathStr)}</div>
            return `
                      <div>
                        <div class="tooltip-title">${treePathStr}</div>
                        ${txnStr}
                        <div>Amount: ${formatCurrency(info.value, { currency: info.data.account_currency })}</div>
                        <div>Percentage: ${percentage}</div>
                      </div>
                    `;
          },
        },

        //   text: "Income and Expenses Jan-Dec 2024",
        //   subtext: "Exclude transfers and share proceeds",
        //   left: "center",
        // },
        series: [
          {
            name: "Tree",
            type: "treemap",
            left: 0,
            top: 0,
            bottom: 50,
            right: 0,
            visibleMin: 300,
            label: {
              show: true,
              formatter: "{b}",
            },
            colorSaturation: [0.55, 0.7],
            upperLabel: {
              show: false,
              height: 40,
              color: "#fff",
            },
            levels: [

              // Level 0: Income & Expense
              {
                itemStyle: {
                  borderColor: "#777",
                  borderWidth: 0,
                  gapWidth: 0,
                },
                upperLabel: {
                  show: false,
                },

              },

              // Level 1: Income vs Expense
              {
                colorSaturation: [0.5, 0.35],
                itemStyle: {
                  borderColor: "#555",
                  borderWidth: 5,
                  gapWidth: 0,
                  borderColorSaturation: 0.2,
                },
                upperLabel: {
                  show: headingLevel>=1, 
                  formatter: formatUpperLabel,
                },

                color: [
                  "#314656",
                  "#61a0a8",
                  "#dd8668",
                  "#91c7ae",
                  "#6e7074",
                  "#61a0a8",
                  "#bda29a",
                  "#44525d",
                  "#c4ccd3",
                  "#c23531",
                ],
              },

              // Level 2: Expense > Salary
              {
                colorSaturation: [0.6, 0.4],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.3,
                },
                upperLabel: {
                  show: headingLevel>=2,
                  formatter: formatUpperLabel,
                },
              },

              // Level 3: Expense > Household > Bank Interest
              {
                colorSaturation: [0.7, 0.5],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.4,
                },
                upperLabel: {
                  show: headingLevel>=3,
                  formatter: formatUpperLabel,
                },

              },

              // Level 4: Expense > Household > Bank Interest > Savings
              {
                colorSaturation: [0.8, 0.6],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.6,
                },
                upperLabel: {
                  show: headingLevel>=4,
                  formatter: formatUpperLabel,
                },

              },
              {
                colorSaturation: [0.9, 0.7],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.7,
                },
                upperLabel: {
                  show: headingLevel>=5,
                  formatter: formatUpperLabel,
                },
              },
            ],
            data: tree,
          },
        ],
      });
    }
  }, [data, incomeEnabled, expenseEnabled, headingLevel]);

  return (
    <>
      <Toolbar />

      <div className="flex justify-center py-2">
        <VisualizeTreeToolbar
          options={treeOptions}
          setOptions={setTreeOptions}
        />
      </div>

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
            option={option}
            lazyUpdate={true}
            style={{ width: "100%", height: "100%" }}
            theme={{ theme }}
          />
        )}
      </div>

    </>
  );
}
