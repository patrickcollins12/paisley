
export function formatAmount(amt) {

  if (amt === "") return ""

  // Format the amount as a dollar amount
  // TODO: Remove USD
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(amt))

}

export function formatAmountCell(amt) {
  if (!amt) {
    return <></>
  }
  else {
    const amount = formatAmount(amt)
    return <div className="text-right whitespace-nowrap">{amount}</div>
  }
}
