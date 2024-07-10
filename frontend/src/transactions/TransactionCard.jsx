import { Card, CardContent } from "@/components/ui/card.jsx"
import { Badge } from "@/components/ui/badge.jsx"

import { DateTime } from 'luxon'
import useAccountData from "@/accounts/AccountApiHooks.js"
import { formatAmountCell } from "@/transactions/TransactionFieldFormatters.jsx"

export default function TransactionCard({ data }) {

  const dateTime = DateTime.fromISO(data.datetime);
  const { data: accountData } = useAccountData(data.account_number);
  
  const tagAndParty = [...data.tags, ...data.party]

  return (
    <Card key={data.id}>
      <CardContent className="flex flex-col p-3 gap-3">
        <div className="flex col-2 justify-between gap-3">
          <div className="flex whitespace-nowrap">
            {dateTime.toFormat("dd LLL yyyy")}
          </div>
          <div className="text-right opacity-50">
            {accountData?.shortname}
          </div>
        </div>
        <div className="flex col-2 justify-between items-end gap-3">
          <div className="text-xs">
            {data.description}
          </div>
          <div>
            {formatAmountCell(data.amount)}
          </div>
        </div>
        <div className="flex flex-row">
          <div>
            {tagAndParty.map(tag => (
              <Badge key={tag} variant="colored">{tag}</Badge>
            ))}
          </div>
        </div>


      </CardContent>
    </Card>
  )
}