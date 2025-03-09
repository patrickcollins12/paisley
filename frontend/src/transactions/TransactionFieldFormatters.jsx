import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";

export function formatAmountCell(amt) {
  if (!amt) {
    return <></>
  }
  else {
    // const amount = formatAmount(amt)
    return <div className="text-right whitespace-nowrap">{formatCurrency(amt)}</div>
  }
}
