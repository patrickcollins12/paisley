import { Route as RuleEditRoute } from "@/routes/rules.$ruleId.jsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
// import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollableSidebar } from "@/components/ScrollableSidebar.jsx"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Trash2,
  CirclePlus
} from "lucide-react"

export default function RuleEditPage() {
  const { ruleId } = RuleEditRoute.useParams();

  return (
    <div className="flex justify-center gap-3">
      <Card className="text-sm ">
        <CardHeader>
          <CardTitle>{(ruleId === "new") ? "New Rule" : "Edit Rule"}</CardTitle>
          <CardDescription>
            When specific conditions occur, automatically add Tags or Merchants
          </CardDescription>
        </CardHeader>
        <CardContent>

          <fieldset className="grid gap-6 rounded-lg border p-4  my-6">
            <legend className=" px-1 text-sm font-medium">When these conditions match ... </legend>
            <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-3 items-center">

              <div className="">
              </div>

              <div className="">
                <Select>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Description" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="">
                <Select>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Contains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="does_not">Does not contain</SelectItem>
                    <SelectItem value="debit">Starts with</SelectItem>
                    <SelectItem value="credit">Regex Matches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[300px]">
                <Input defaultValue="amazon" ></Input>
              </div>

              <div><Trash2 className="opacity-30"></Trash2></div>

              {/* Row 3  */}
              <div className="">
                <Select>
                  <SelectTrigger className="">
                    <SelectValue placeholder="And" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">And</SelectItem>
                    <SelectItem value="or">Or</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Select>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Description" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="">
                <Select defaultValue="does_not">
                  <SelectTrigger className="">
                    <SelectValue placeholder="Contains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="does_not">Does not contain</SelectItem>
                    <SelectItem value="debit">Starts with</SelectItem>
                    <SelectItem value="credit">Regex Matches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Input defaultValue="prime" ></Input>
              </div>
              <div><Trash2 className="opacity-30"></Trash2></div>


              {/* Row 2 */}
              <div className="">
                <Select>
                  <SelectTrigger className="">
                    <SelectValue placeholder="And" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">And</SelectItem>
                    <SelectItem value="or">Or</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Select defaultValue="amount">
                  <SelectTrigger>
                    <SelectValue placeholder="Based on " />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="">
                <Select defaultValue="lt">
                  <SelectTrigger className="">
                    <SelectValue placeholder="Contains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">is less than</SelectItem>
                    <SelectItem value="gt">is greater than</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Input defaultValue="50.00"></Input>
              </div>

              <div><Trash2 className="opacity-30"></Trash2></div>


              {/* New row */}
              <div></div>
              <div><Button variant="secondary"><CirclePlus className="mr-3" />New condition</Button></div>
              <div></div>
              <div></div>
              {/* <div><CirclePlus/></div> */}
              <div></div>

            </div>
          </fieldset>

          {/* <div className="flex justify-end gap-4 my-3"><Button variant="secondary"><CirclePlus className="mr-3" />New condition group</Button></div> */}


          <fieldset className="grid gap-6 rounded-lg border p-4 my-6">
            <legend className=" px-1 text-sm font-medium">... add these tags</legend>
            <div>
              <Badge
                variant="colored"
                >Transfer &gt; Insurance
              </Badge>

              <Badge
                variant="colored"
                >Salary &gt; Expenses
              </Badge>

            </div>

          </fieldset>
          <fieldset className="grid gap-6 rounded-lg border p-4 my-6">
            <legend className=" px-1 text-sm font-medium">... add this merchant</legend>
            <div>
              <Badge
                variant="colored"
                >Amazon
              </Badge>
            </div>
          </fieldset>

        </CardContent>
        <CardFooter className="justify-end gap-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>

      <Card className="text-sm max-w-[450px]">
        <CardHeader>
          <CardTitle>Matching Transactions</CardTitle>
          <CardDescription>
            Transactions that currently match these conditions
          </CardDescription>
        </CardHeader>

        <CardContent className="">
          <ScrollableSidebar className=" flex flex-col gap-3 ">

            <Card className="">
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice has a really long bank name that keeps going</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">WITHDRAWAL MOBILE 1244398 TFR Bump Saving DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Transfer &gt; Insurance
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>

                </div>

              </CardContent>
            </Card>

            <Card className="">
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">ACHIEVE SEWING BAS CARINGBAH AUS</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Westpac Mortgage</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP SYDNEY SOUTH AUS</div>
                  <div>$30</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice has a really long bank name that keeps going</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">WITHDRAWAL MOBILE 1244398 TFR Bump Saving DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Transfer &gt; Insurance
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>

                </div>

              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">ACHIEVE SEWING BAS CARINGBAH AUS</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Westpac Mortgage</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP SYDNEY SOUTH AUS</div>
                  <div>$30</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice has a really long bank name that keeps going</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">WITHDRAWAL MOBILE 1244398 TFR Bump Saving DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Transfer &gt; Insurance
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>

                </div>

              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">ACHIEVE SEWING BAS CARINGBAH AUS</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Westpac Mortgage</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP SYDNEY SOUTH AUS</div>
                  <div>$30</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice has a really long bank name that keeps going</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">WITHDRAWAL MOBILE 1244398 TFR Bump Saving DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Transfer &gt; Insurance
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>

                </div>

              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Bankwest Choice</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">ACHIEVE SEWING BAS CARINGBAH AUS</div>
                  <div>$50</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                  <Badge
                    variant="colored"
                    >Salary &gt; Expenses
                  </Badge>
                  <Badge
                    variant="colored"
                    >Salary &gt; Stuff
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card >
              <CardContent className="flex flex-col p-3 gap-3">
                <div className="flex col-2 justify-between gap-3">
                  <div className="flex whitespace-nowrap">27 Jan 2024</div>
                  <div className="text-right opacity-50">Westpac Mortgage</div>
                </div>
                <div className="flex col-2 justify-between items-end gap-3">
                  <div className="text-xs">DEBIT CARD PURCHASE AMZNPRIMEAU MEMBERSHIP SYDNEY SOUTH AUS</div>
                  <div>$30</div>
                </div>
                <div>
                  <Badge
                    variant="colored"
                    >Really quite &gt; Very long &gt; Tags
                  </Badge>

                </div>
              </CardContent>
            </Card>

          </ScrollableSidebar>

        </CardContent>


      </Card>

    </div>


  )
}