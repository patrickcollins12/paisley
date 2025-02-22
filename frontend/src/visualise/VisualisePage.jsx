import React, { useState, useEffect } from "react";
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { DateTime } from "luxon";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

export default function VisualisePage() {
  const searchContext = useSearch();
  const [option, setOption] = useState(null);

  const { data, isLoading, error } = useFetchTransactions({
    pageIndex: 0,
    pageSize: 10000000,
    filters: searchContext.getFilters(),
    orderBy: null,
  });

  useEffect(() => {
    if (data && data.results) {
      const tree = turnTransactionQueryIntoTreemapStucture(data.results);

      setOption({
        tooltip: {
          formatter: function (info) {
            const treePath = info.treePathInfo
              .slice(1)
              .map((item) => item.name);

            let txnStr = "";
            if (info.data?.description) {
              treePath.pop();
              txnStr = `<div>
                        <div>${info.data.description}</div>
                        <div>${info.data.date}</div>
                        <div>${info.data.account_shortname} (${info.data.account_number})</div>
                        </div>`;
            }

            const treePathStr = treePath.join(" > ");
            const roundedValue = info.value.toFixed(2);
            const formattedValue = echarts.format.addCommas(roundedValue);

            return `
                      <div>
                        <div class="tooltip-title">${echarts.format.encodeHTML(treePathStr)}</div>
                        ${txnStr}
                        <div>Amount: $${formattedValue}</div>
                      </div>
                    `;
          },
        },
        // title: {
        //   text: "Income and Expenses Jan-Dec 2024",
        //   subtext: "Exclude transfers and share proceeds",
        //   left: "center",
        // },
        series: [
          {
            name: "Income and Expenses",
            type: "treemap",
            visibleMin: 300,
            label: {
              show: true,
              formatter: "{b}",
            },
            colorSaturation: [0.55, 0.7],
            upperLabel: {
              show: true,
              height: 40,
              color: "#fff",
            },
            levels: [
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
              {
                colorSaturation: [0.5, 0.35],
                itemStyle: {
                  borderColor: "#555",
                  borderWidth: 5,
                  gapWidth: 0,
                  borderColorSaturation: 0.2,
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
              {
                colorSaturation: [0.6, 0.4],
                itemStyle: {
                  borderWidth: 1,
                  gapWidth: 0,
                  borderColorSaturation: 0.3,
                },
              },
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
      {!isLoading && !error && data && (
        <>
          {/* <div>Transactions: {data.results.length}</div> */}
          {option && (
            <div style={{ width: `1400px`, height: `700px` }}>
              <ReactECharts
                option={option}
                style={{ width: "100%", height: "100%" }}
                lazyUpdate={true}
              />
            </div>
          )}
        </>
      )}
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
      account_number: row.account_number,
      datetime: DateTime.fromISO(row.datetime),
      date: DateTime.fromISO(row.datetime_without_timezone).toFormat(
        "yyyy-MM-dd"
      ),
    };

    node.path = `${node.description}`;
    node.name = node.description;
    node.tagsString = row.tags?.join(", ");
    node.partyString = row.party?.join(", ");

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
