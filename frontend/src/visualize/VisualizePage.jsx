import React, { useState, useEffect, useRef } from "react";
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { useResolvedTheme } from "@/components/theme-provider";
import { DateTime } from "luxon";
import ReactECharts from "echarts-for-react";
import { graphic, format } from 'echarts';
const { LinearGradient } = graphic;
// import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";

export default function VisualizePage() {
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
      const tree = turnTransactionQueryIntoTreemapStucture(data.results);

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

            return `
                      <div>
                        <div class="tooltip-title">${format.encodeHTML(treePathStr)}</div>
                        ${txnStr}
                        <div>Amount: ${formatCurrency(info.value, { currency: info.data.account_currency })}</div>
                        <div>Percentage: ${ percentage }</div>
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
            name: "Income and Expenses",
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
                  show: true,
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

              // Level 2: Salary, Household
              {
                colorSaturation: [0.6, 0.4],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.3,
                },
                upperLabel: {
                  show: true,
                  formatter: formatUpperLabel,
                },
              },

              // Level 3: Household > Bank Interest
              {
                colorSaturation: [0.7, 0.5],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.4,
                },
              },
              {
                colorSaturation: [0.8, 0.6],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.6,
                },
              },
              {
                colorSaturation: [0.9, 0.7],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.7,
                },
              },
            ],
            data: tree,
          },
        ],
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
          <ReactECharts
            option={option}
            style={{ width: "100%", height: "100%" }}
            lazyUpdate={true}
            theme={{ theme }}
          />
        )}
      </div>

    </>
  );

  // ✅ Verified unchanged data transformation logic
  function turnTransactionQueryIntoTreemapStucture(rows) {
    const tree = [];
    for (let row of rows) {
      processRow(row, tree);
    }
    return tree;
  }

  function processRow(row, tree) {
    row.tags = row.tags?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.tags.length === 0) row.tags.push("Uncategorized");

    row.party = row.party?.map((tag) => tag.replace(/\s*>\s*/g, " > ")) || [];
    if (row.party.length === 0) row.party.push("Uncategorized");

    const node = {
      credit: parseFloat(row.credit) || 0,
      debit: parseFloat(row.debit) || 0,
      amount: parseFloat(row.amount) || 0,
      value: Math.abs(parseFloat(row.amount)) || 0.0,
      description: row.description,
      account_shortname: row.account_shortname,
      account_currency: row.account_currency,
      account_number: row.account_number,
      datetime: DateTime.fromISO(row.datetime),
      date: DateTime.fromISO(row.datetime_without_timezone).toFormat(
        "yyyy-MM-dd"
      ),
    };

    node.tagsString = row.tags?.join(", ");
    node.partyString = row.party?.join(", ");

    node.path = `${node.description}`;
    node.name = (node.partyString !== "Uncategorized") ? node.partyString : node.description;

    const tag = row.tags[0];
    const segments = tag.split(/\s*>\s*/);

    if (node.amount > 0) {
      segments.unshift("Income");
    } else {
      segments.unshift("Expense");
    }

    autovivifyTree(tree, segments, node);
  }

  function autovivifyTree(root, pathSegments, newNode) {
    let currentLevel = root;

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const fullPath = pathSegments.slice(0, i + 1).join(" / ");

      let node = currentLevel.find((node) => node.path === fullPath);
      if (!node) {
        node = { path: fullPath, name: segment, children: [] };
        currentLevel.push(node);
      }

      currentLevel = node.children;
    }

    currentLevel.push(newNode);
  }
}
