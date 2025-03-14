import { Card, CardContent } from "@/components/ui/card.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import useAccountData from "@/accounts/AccountApiHooks.js"
import { Currency } from "@/components/CurrencyDisplay.jsx";

import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';

export default function TransactionCard({ data }) {

  const { data: accountData } = useAccountData(data.account_number);
  
  const tagAndParty = [...data.tags, ...data.party]

  return (
    <Card key={data.id}>
      <CardContent className="flex flex-col p-3 gap-3">
        <div className="flex col-2 justify-between gap-3">
          <div className="flex whitespace-nowrap">
            <DateTimeDisplay datetime={data.datetime} />
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
            <Currency currency={data.account_currency}>{data.amount}</Currency>
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