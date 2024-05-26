import useAccountData from "@/accounts/AccountApiHooks.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"

const filterKeys = ['accountid', 'account', 'name'];

function AccountPage() {
  const { data, error, isLoading } = useAccountData();

  return (
    <div className='flex flex-row gap-4'>
      {data && Object.keys(data).map(accountId => (
        <Card key={accountId} className='basis-1/5'>
          <CardHeader className='border-b border-accent'>
            <CardTitle>{accountId}</CardTitle>
            <CardDescription>{data[accountId].name}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-y-3 py-3'>
            {Object.keys(data[accountId]).filter(x => !filterKeys.includes(x)).map(accountDetail => (
              <div key={accountDetail}>
                <p className='font-bold text-sm capitalize'>{accountDetail}</p>
                <p className='text-sm'>{data[accountId][accountDetail]}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default AccountPage;