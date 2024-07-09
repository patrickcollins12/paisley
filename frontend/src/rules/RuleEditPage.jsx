import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"

import { ChevronLeft } from "lucide-react"

import { ScrollableSidebar } from "@/components/ScrollableSidebar.jsx"
import { useFetchRule, useUpdateRules } from "@/rules/RuleApiHooks.jsx"
import { getRouteApi, Link } from "@tanstack/react-router"
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx"
import TransactionCard from "@/transactions/TransactionCard.jsx"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input.jsx"
import { ReactSelect } from "@/components/ReactSelect.jsx"

import { useFetchTags } from "@/tags/TagApiHooks.js"
import { Button } from "@/components/ui/button.jsx"
import { useDebounce, useLogger, usePrevious } from "react-use"
import { useToast } from "@/components/ui/use-toast.js"

const routeApi = getRouteApi('/rules/$ruleId');

export default function RuleEditPage() {
  // useLogger('RuleEditPage');

  const { toast } = useToast();
  const navigate = routeApi.useNavigate();

  // grab the path parameter from the URL
  const { ruleId } = routeApi.useParams();

  // convert the ruleId into either a number or null
  // null means that it is a new rule
  const id = Number.parseInt(ruleId) ? Number(ruleId) : null;

  // keep track of the form state
  const [ruleData, setRuleData] = useState({rule: null, tag: [], party: []});
  const [tagData, setTagData] = useState([]);
  const [partyData, setPartyData] = useState([]);

  // "raw" state for keeping track of just the rule string so we can debounce it
  const [ruleString, setRuleString] = useState('')

  // track error to display out to the user
  const [error, setError] = useState(null);

  // pass the id into the API hook. When NULL the hook will not attempt to fetch any data.
  // NOTE: useXYZ hooks should NEVER be used inside loops, conditional blocks or callbacks
  // https://legacy.reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions
  const { data, mutate } = useFetchRule(id);
  const { update, create } = useUpdateRules();
  const { data: transactionData, error: transactionFetchError } = useFetchTransactions({
    pageIndex: 0,
    pageSize: 100,
    orderBy: { field: 'datetime', dir: 'desc' },
    ruleFilter: ruleData?.rule
  });

  // grab the total number of for the rule
  const transactionCount = transactionData?.resultSummary ? transactionData.resultSummary.count : 0;

  // keep track of whether SWR has flipped data from undefined to actual data
  // we have to do this avoid updating the rule when the page first renders 🙃
  const firstUpdateCompleted = useRef(false);

  // keep the state in sync with the data
  // this is mainly needed because SWR will return data as undefined at first
  // and then it will update data with the actual results from the API.
  useEffect(() => {
    setRuleData(data);
    setTagData(data?.tag)
    setPartyData(data?.party)
    setRuleString(data?.rule ?? '');
  }, [data]);

  // Keeps ruleData in sync with the form. This is a bit ugly but will do for now.
  // Specifically, for the rule string we are going to debounce the update
  useDebounce(() => {
    setRuleData(prevState => ({ ...prevState, rule: ruleString }));
    if (firstUpdateCompleted.current) {
      updateRule(id, { rule: ruleString });
    }
    firstUpdateCompleted.current = true;
  }, 500, [ruleString]);

  // tags
  const handleTagChange = selectedValues => {
    // const values = selectedValues.map(obj => obj.value);
    setTagData(selectedValues)
    setRuleData(prevState => ({ ...prevState, tag: selectedValues }));
  };

  const handleTagBlur = e => {
    updateRule(id, { tag: tagData});
  };

  // parties
  const handlePartyChange = selectedValues => {
    // const values = selectedValues.map(obj => obj.value);
    setPartyData(selectedValues)
    setRuleData(prevState => ({ ...prevState, party: selectedValues }));
  };

  const handlePartyBlur = e => {
    updateRule(id, { party: partyData});
  };


  async function createRule(evt) {
    evt.preventDefault();
    if (id) return;

    try {
      const result = await create(ruleData);
      const newId = result?.id ?? null;
      if (newId) {
        toast({ description: 'Rule created successfully', duration: 1000 });
        setError(null);
        await navigate({ to: '/rules/$ruleId', params: { ruleId: newId } });
      }
    } catch (error) {
      setError(error?.response?.data?.error ?? null);
      console.error('Error creating rule:', error);
    }
  }

  async function updateRule(id, data) {
    if (!id) return;

    try {
      await update(id, data);
      await mutate();
      toast({ description: 'Rule saved successfully', duration: 1000 });
      setError(null);
    } catch (error) {
      setError(error?.response?.data?.error ?? null);
      console.error('Error saving rule:', error);
    }
  }

  return (<>

    <div className="pb-4 text-sm text-muted-foreground">
      <Link to="/rules">
        <div className="flex items-center">
          <ChevronLeft size={16} />
          <div>Back</div>
        </div>
      </Link>
    </div>

    <div className="flex justify-center gap-3">
      <Card className="text-sm w-[550px]">
        <CardHeader>
          <CardTitle>{(ruleId === "new") ? "New Rule" : "Edit Rule"}</CardTitle>
          <CardDescription>
            When specific conditions occur, automatically add Tags or Merchants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createRule}>
            <div className="flex flex-col gap-3">
              <div>
                <div className="py-2 text-sm text-muted-foreground">
                  When these conditions match ...
                </div>

                <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-3 items-center">
                  <div className="col-span-6">
                    {/* <div className="opacity-50">Final Rule</div> */}
                    <Input
                      value={ruleString}
                      name="rule"
                      onChange={event => setRuleString(event.target.value)}
                      autoComplete="off" />
                    {(error || transactionFetchError) &&
                      <div className="text-red-600 py-2">
                        {error ?? transactionFetchError?.response?.data?.error}
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div>
                <div className="py-2 text-sm text-muted-foreground">
                  Add these tags
                </div>
                <ReactSelect
                  onChange={handleTagChange}
                  onBlur={handleTagBlur}
                  optionsAsArray={useFetchTags('tags').data}
                  valueAsArray={ tagData }
                  isMulti={true}
                  isCreatable={true}
                  coloredPills={true}
                  isClearable={true}
                  closeMenuOnSelect={false}
                  placeholder="Add a tag..."
                />

              </div>
              <div>
                <div className="py-2 text-sm text-muted-foreground">
                  Add this counterparty / merchant
                </div>
                <ReactSelect
                  onChange={handlePartyChange}
                  onBlur={handlePartyBlur}
                  // options={useFetchTags('parties').data?.map(party => ({ label: party, value: party}))}
                  // value={ partyData?.map(party => ({ label: party, value: party})) }
                  optionsAsArray={useFetchTags('parties').data}
                  valueAsArray={ partyData }
                  isMulti={false}
                  isCreatable={true}
                  coloredPills={true}
                  isClearable={true}
                  closeMenuOnSelect={false}
                  placeholder="Add a party..."
                />

              </div> 

              {/* only show the save button when we are creating a new rule */}
              {/* rule data is saved automatically when editing an existing rule */}
              {!id &&
                <div className="flex justify-between">
                  <Button type="submit">Save</Button>
                </div>
              }
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="text-sm w-[450px]">
        <CardHeader>
          <CardTitle>Matching Transactions</CardTitle>
          <CardDescription>
            {transactionCount} transactions currently match this rule
          </CardDescription>
        </CardHeader>

        <CardContent className="">
          <ScrollableSidebar className=" flex flex-col gap-3 ">
            {transactionData?.results.map(transaction => <TransactionCard key={transaction.id} data={transaction} />)}
          </ScrollableSidebar>
        </CardContent>
      </Card>
    </div>
  </>
  )
}