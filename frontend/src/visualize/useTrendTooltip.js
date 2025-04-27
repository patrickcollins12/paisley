import { useState, useEffect, useRef } from 'react';

export function useTrendTooltip(chartRef, dateGroups) {
  const tooltipRef = useRef(null); // Ref for the tooltip DOM element itself
  const [tooltipInfo, setTooltipInfo] = useState({
    displayDate: null,
    seriesName: null,
    seriesValue: null,
    transactions: [], // Initialize as empty array
  });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [rawTooltipPosition, setRawTooltipPosition] = useState({ x: 0, y: 0 }); // Raw mouse position
  const [finalTooltipPosition, setFinalTooltipPosition] = useState({ x: 0, y: 0 }); // Calculated position

  // Effect to add/remove ECharts event listeners
  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) {
      return; // Return early if no chart instance
    }

    const handleMouseMove = (params) => {
      const rawX = params.event.clientX + 5;
      const rawY = params.event.clientY + 5;
      setRawTooltipPosition({ x: rawX, y: rawY });
    };

    const handleShowTip = (params) => {
      // Extract data based on trigger: 'item'
      const { seriesIndex, dataIndex, name, value, seriesName } = params;
      let displayDate = params.name;
      let extractedSeriesName = params.seriesName;
      let extractedValue = params.value;
      let transactions = []; // Initialize transactions for this tip

      // Fallback/Refinement
      if (seriesIndex != null && dataIndex != null) {
        const currentOption = chart.getOption();
        if (!displayDate && currentOption?.xAxis?.[0]?.data) {
          displayDate = currentOption.xAxis[0].data[dataIndex];
        }
        if (!extractedSeriesName && currentOption?.series) {
          extractedSeriesName = currentOption.series[seriesIndex]?.name;
        }
        if (extractedValue == null && currentOption?.series) {
          const dataItem = currentOption.series[seriesIndex]?.data?.[dataIndex];
          extractedValue = typeof dataItem === 'object' ? dataItem.value : dataItem;
        }
      }

      // Look up transactions using displayDate (groupKey) and seriesName (tag)
      if (displayDate && extractedSeriesName && dateGroups) {
        const groupData = dateGroups.get(displayDate);
        const tagData = groupData?.get(extractedSeriesName);
        if (tagData && Array.isArray(tagData.transactions)) {
          transactions = tagData.transactions;
        }
      }

      if (displayDate != null || extractedValue != null) {
        setTooltipInfo({
          displayDate,
          seriesName: extractedSeriesName,
          seriesValue: extractedValue,
          transactions // Pass the found transactions
        });
        setIsTooltipVisible(true);
      }
    };

    const handleHideTip = () => {
      setIsTooltipVisible(false);
      setTooltipInfo({
        displayDate: null,
        seriesName: null,
        seriesValue: null,
        transactions: [],
      }); // Reset info
    };

    // Register listeners
    const zr = chart.getZr();
    zr.on('mousemove', handleMouseMove);
    chart.on('showTip', handleShowTip);
    chart.on('hideTip', handleHideTip);

    // Cleanup function
    return () => {
      // Ensure chart and zr still exist and chart hasn't been disposed before removing listeners
      if (chart && !chart.isDisposed()) {
          const currentZr = chart.getZr();
          if (currentZr) {
            currentZr.off('mousemove', handleMouseMove);
          }
          chart.off('showTip', handleShowTip);
          chart.off('hideTip', handleHideTip);
      }
    };
    // Depend on the ref's current value. Effect reruns when the instance is ready.
  }, [chartRef.current, dateGroups]);

  // Effect to calculate final tooltip position *after* render/measurement
  useEffect(() => {
    if (isTooltipVisible && tooltipRef.current && rawTooltipPosition) {
      const margin = 10;
      const rawX = rawTooltipPosition.x;
      const rawY = rawTooltipPosition.y;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;

      let adjX = rawX;
      let adjY = rawY;

      if (rawX + tooltipWidth + margin > winWidth) {
        adjX = rawX - tooltipWidth - 10;
      }
      if (rawY + tooltipHeight + margin > winHeight) {
        adjY = rawY - tooltipHeight - 10;
      }
      adjX = Math.max(margin, adjX);
      adjY = Math.max(margin, adjY);

      setFinalTooltipPosition({ x: adjX, y: adjY });
    }
  }, [isTooltipVisible, rawTooltipPosition, tooltipInfo]);

  return {
    tooltipRef,
    isTooltipVisible,
    tooltipInfo,
    finalTooltipPosition,
  };
} 