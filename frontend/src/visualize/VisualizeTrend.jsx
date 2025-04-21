import React, { useState, useEffect, useRef } from "react";
import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";
import { useResolvedTheme } from "@/components/theme-provider";
import { DateTime } from "luxon";


// import ReactECharts from "echarts-for-react";
// import { graphic, format } from 'echarts';

// import the core library.
import ReactEChartsCore from 'echarts-for-react/lib/core';

// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import {
  LineChart,

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
  [TooltipComponent, LineChart, DatasetComponent, CanvasRenderer]
);

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

  useEffect(() => {
    if (data && data.results) {
      // const tree = turnTransactionQueryIntoTreemapStucture(data.results);
      const chartData = turnTransactionQueryIntoLineChartStructure(data.results, "day", 2);

      // print the first 10 items of the chartData as json strigify
      // console.log(JSON.stringify(chartData.series.slice(0, 10), null, 2));
      // print the first 10 entries of the chartData.dates array
      // console.log(chartData.dates.slice(0, 10));

      setOption({

        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },

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
          stack: 'Total',
          areaStyle: {},
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
            option={option}
            lazyUpdate={true}
            style={{ width: "100%", height: "100%" }}
            theme={{ theme }}
          />
        )}
      </div>

    </>
  );




  // Input:
  // const input = [
  //   {
  //     "id": "424457a54e7ba2cfd52500bd75293fe4006703a9be1326eb2641f143fd96fe1c",
  //     "datetime": "2025-04-17T15:04:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "To Mitch Collins 03:04PM 17Apr",
  //     "revised_description": "To Mitch Collins",
  //     "description": "To Mitch Collins",
  //     "debit": 100,
  //     "amount": -100,
  //     "balance": 408801.74,
  //     "type": "WDL",
  //     "auto_tags": [
  //       "Kids > Mitch"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       147,
  //       148
  //     ],
  //     "auto_party_rule_ids": [
  //       null
  //     ],
  //     "tags": [
  //       "Kids > Mitch"
  //     ],
  //     "party": [],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "67babff8bc3cde4cfb5d007c53748f46024f75d88f629ec2a820bf07e45b7424",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "Reddy Express 1606 Neutral Bay AUS",
  //     "description": "Reddy Express 1606 Neutral Bay AUS",
  //     "debit": 7,
  //     "amount": -7,
  //     "balance": 408743.39,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Food > Take Away"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Reddy Express"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       331
  //     ],
  //     "auto_party_rule_ids": [
  //       331
  //     ],
  //     "tags": [
  //       "Food > Take Away"
  //     ],
  //     "party": [
  //       "Reddy Express"
  //     ],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "80dcb84a49bdb047fc635699e79390c84a2729159c964f8a801b2a96aed1adcb",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "TRANSPORTFORNSW OP CHIPPENDALE AUS",
  //     "description": "TRANSPORTFORNSW OP CHIPPENDALE AUS",
  //     "debit": 10,
  //     "amount": -10,
  //     "balance": 408733.39,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Travel > Transport > Public Transit"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Transport NSW"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       114
  //     ],
  //     "auto_party_rule_ids": [
  //       114
  //     ],
  //     "tags": [
  //       "Travel > Transport > Public Transit"
  //     ],
  //     "party": [
  //       "Transport NSW"
  //     ],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "250370546b91ee19d1b7aed7d9d2839584815c0096f4354cd06978f07f3c55f5",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "SUSHI HUB WESTFIEL CHATSWOOD AUS",
  //     "description": "SUSHI HUB WESTFIEL CHATSWOOD AUS",
  //     "debit": 13.2,
  //     "amount": -13.2,
  //     "balance": 408341.92,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Food > Take Away"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       45
  //     ],
  //     "auto_party_rule_ids": [
  //       null
  //     ],
  //     "tags": [
  //       "Food > Take Away"
  //     ],
  //     "party": [],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "91be731b0c538440e49f83743f67ee9169ed09ee575512c0cffb43a3b95958c2",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "KVL ROSE FOR YOU P ASHFIELD AUS",
  //     "description": "KVL ROSE FOR YOU P ASHFIELD AUS",
  //     "debit": 15,
  //     "amount": -15,
  //     "balance": 408718.39,
  //     "type": "WDC",
  //     "auto_tags": [],
  //     "manual_tags": [],
  //     "auto_party": [],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [],
  //     "auto_party_rule_ids": [
  //       null
  //     ],
  //     "tags": [],
  //     "party": [],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "d92a1ae6d2f521f6577a19122684291b2cd45444163a00a52e02fe43a531f228",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "PLINEPH CHATSWOOD CHATSWOOD AUS",
  //     "description": "PLINEPH CHATSWOOD CHATSWOOD AUS",
  //     "debit": 29.39,
  //     "amount": -29.39,
  //     "balance": 408355.12,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Health > Pharmacy"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Priceline Pharmacy"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       65
  //     ],
  //     "auto_party_rule_ids": [
  //       65
  //     ],
  //     "tags": [
  //       "Health > Pharmacy"
  //     ],
  //     "party": [
  //       "Priceline Pharmacy"
  //     ],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "5d58134d5cfd2b8ad6fda61bc3ec8f99f10fea6445cf92ddcaba4d8b807af8c0",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "CANTEEN AUSTRALIA SYDNEY AUS",
  //     "description": "CANTEEN AUSTRALIA SYDNEY AUS",
  //     "debit": 39,
  //     "amount": -39,
  //     "balance": 408598.4,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Tax > Donation"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Canteen Kids Cancer"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       344
  //     ],
  //     "auto_party_rule_ids": [
  //       344
  //     ],
  //     "tags": [
  //       "Tax > Donation"
  //     ],
  //     "party": [
  //       "Canteen Kids Cancer"
  //     ],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "e8ccd865632a064a61f9beba8344a5a3175ce633fe5ad691aaa1108cdfb0dca1",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "Kujira Ashfield AUS",
  //     "description": "Kujira Ashfield AUS",
  //     "debit": 50.85,
  //     "amount": -50.85,
  //     "balance": 408384.51,
  //     "type": "WDC",
  //     "auto_tags": [],
  //     "manual_tags": [],
  //     "auto_party": [],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [],
  //     "auto_party_rule_ids": [
  //       null
  //     ],
  //     "tags": [],
  //     "party": [],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "24096392f9e964fdd10a369694720cfb62bf44ffd34df59539643533e7b62598",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "AMAZON MARKETPLACE SYDNEY SOUTH AUS",
  //     "description": "AMAZON MARKETPLACE SYDNEY SOUTH AUS",
  //     "debit": 51.35,
  //     "amount": -51.35,
  //     "balance": 408750.39,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Online Shopping",
  //       "General"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Amazon"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       9
  //     ],
  //     "auto_party_rule_ids": [
  //       9
  //     ],
  //     "tags": [
  //       "Online Shopping",
  //       "General"
  //     ],
  //     "party": [
  //       "Amazon"
  //     ],
  //     "auto_categorize": true
  //   },
  //   {
  //     "id": "b8de96eea315986fccb938ef6094217d908946dfcbd37fd01a91292616105d21",
  //     "datetime": "2025-04-17T00:00:00.000+10:00",
  //     "datetime_without_timezone": "2025-04-17",
  //     "account_number": "302985 1360851",
  //     "account_shortname": "Offset Transaction",
  //     "account_currency": "AUD",
  //     "orig_description": "WOOLWORTHS 10 CHATSWOOD EAS AUS",
  //     "description": "WOOLWORTHS 10 CHATSWOOD EAS AUS",
  //     "debit": 80.99,
  //     "amount": -80.99,
  //     "balance": 408637.4,
  //     "type": "WDC",
  //     "auto_tags": [
  //       "Food > Groceries"
  //     ],
  //     "manual_tags": [],
  //     "auto_party": [
  //       "Woolworths"
  //     ],
  //     "manual_party": [],
  //     "auto_tags_rule_ids": [
  //       16
  //     ],
  //     "auto_party_rule_ids": [
  //       16
  //     ],
  //     "tags": [
  //       "Food > Groceries"
  //     ],
  //     "party": [
  //       "Woolworths"
  //     ],
  //     "auto_categorize": true
  //   }
  // ]

  // output:
  // xaxis: ["2025-04-17", "2025-04-18", "2025-04-19"]
  // series:
  // [
  //   {
  //     name: "Income > Salary",
  //     data: [100,200,300]
  //   },
  //   {
  //     name: "Income > Dividends > ASX:BHP",
  //     data: [100,200,300]
  //   },
  // ]

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


  // ✅ Verified unchanged data transformation logic
  function turnTransactionQueryIntoTreemapStucture(rows) {
    return rows.reduce((tree, row) => { processRow(row, tree); return tree; }, []);
  }

  function processRowOld(row, tree) {
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
      date: DateTime.fromISO(row.datetime_without_timezone).toFormat("yyyy-MM-dd"),
    };

    node.tagsString = row.tags?.join(", ");
    node.partyString = row.party?.join(", ");

    node.path = `${node.description}`;
    node.name = (node.partyString !== "Uncategorized") ? node.partyString : node.description;

    const tag = row.tags[0];
    const segments = tag.split(/\s*>\s*/);

    // prepend Income/Expense to the tag
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
