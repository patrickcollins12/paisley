import React from 'react';
import { formatCurrency } from "@/components/CurrencyDisplay.jsx";
import { DateTimeDisplay } from "@/transactions/DateTimeDisplay.jsx";

export function TrendTooltipContent({ displayDate, seriesName, seriesValue, transactions }) {
//   console.log("Rendering TrendTooltipContent with data:", { date, seriesName, seriesValue, isLoading }); // Remove log again

  // Prepare transactions for display
  const allTransactions = transactions || [];
  const totalTransactionCount = allTransactions.length;
  let displayItems = [];

  // 1. Sort by absolute amount descending
  const sortedByAmount = [...allTransactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  // 2. Take top 6 (or fewer)
  const topTransactions = sortedByAmount.slice(0, 6);

  // 3. Prepare list for rendering
  displayItems = [...topTransactions];

  // 4. Add "more" indicator if needed
  const hiddenCount = totalTransactionCount - topTransactions.length;
  if (hiddenCount > 0) {
    displayItems.push({ type: 'more', count: hiddenCount });
  }

  return (
    // Main container with Tailwind classes
    <div className="bg-background border border-border p-2.5 rounded shadow-md text-xs text-foreground min-w-[250px] max-w-[400px]">
      {/* Display Date */}
      <div className="mb-1 font-bold">{displayDate}</div>

      {/* Active Series Info - Header uses text-xs */}
      {seriesName && (
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-border font-bold text-xs">
          {/* Left side: Series Name and Count */}
          <span className="flex items-center">
            <span>{seriesName}</span>
            {/* Count in parentheses - uses text-[10px] */}
            <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
              ({totalTransactionCount})
            </span>
          </span>
          {/* Right side: Series Value */}
          <span className="ml-4">{formatCurrency(seriesValue)}</span>
        </div>
      )}

      {/* Transaction List - Now using text-xxs */}
      <div className="space-y-1 overflow-y-auto max-h-[150px]">
        {(displayItems.length > 0) ? (
          displayItems.map((item, index) => {
            // Check for the 'more' indicator
            if (item.type === 'more') {
              return (
                // Use text-xxs for the 'more' indicator
                <div key={`more-${index}`} className="text-center text-xxs text-muted-foreground mt-1.5">
                  ... and {item.count} more
                </div>
              );
            }

            // Otherwise, it's a transaction (item is txn)
            const txn = item;
            const key = txn.id ? `txn-${txn.id}` : `txn-${txn.dt.toISO()}-${index}`;
            return (
              // Use text-xxs for the transaction row
              <div key={key} className="flex justify-between items-center text-xxs mb-1">
                {/* Left side: Date and Description */}
                <div className="flex-grow mr-2.5 truncate">
                  {/* DateTimeDisplay component likely controls its own internal font size */}
                  <span className="inline-block w-auto mr-1.5">
                    <DateTimeDisplay
                      datetime={txn.dt}
                      options={{ absolute: true, delta: false, format: 'yyyy-MM-dd' }}
                    />
                  </span>
                  {/* Description also uses text-xxs from parent */}
                  <span title={txn.description}>
                    {txn.description}
                  </span>
                </div>
                {/* Right side: Amount */}
                <div className="flex-shrink-0 text-right min-w-[60px]">
                  {formatCurrency(txn.amount)}
                </div>
              </div>
            );
          })
        ) : (
          // Use text-xxs for the 'no transactions' message
          <div className="text-xxs text-muted-foreground">No transactions for this period.</div>
        )}
      </div>
    </div>
  );
} 