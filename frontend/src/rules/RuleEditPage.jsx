import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"

import { AlertCircle } from "lucide-react"

import { ScrollableSidebar } from "@/components/ScrollableSidebar.jsx"
import { useFetchRule, useUpdateRules } from "@/rules/RuleApiHooks.jsx"
import { getRouteApi } from "@tanstack/react-router"
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx"
import TransactionCard from "@/transactions/TransactionCard.jsx"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input.jsx"
import { ReactSelect } from "@/components/ReactSelect.jsx"

import { BackNav } from "@/components/BackNav.jsx"
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { Button } from "@/components/ui/button.jsx"
import { useDebounce } from "react-use"
import { useToast } from "@/components/ui/use-toast.js"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const routeApi = getRouteApi('/rules/$ruleId');

export default function RuleEditPage({ initialRuleString = '', isModalMode = false, onSaveComplete = null, propRuleId }) {

  const { toast } = useToast();
  const navigate = routeApi.useNavigate();

  // grab the path parameter from the URL or use the prop if in modal mode
  const params = routeApi.useParams();
  const effectiveRuleId = isModalMode ? propRuleId : params.ruleId;

  // convert the ruleId into either a number or null
  // null means that it is a new rule
  const id = Number.parseInt(effectiveRuleId) ? Number(effectiveRuleId) : null;

  // Create a ref for the rule input field to focus it in modal mode
  const ruleInputRef = useRef(null);

  // keep track of the form state
  const [ruleData, setRuleData] = useState({ rule: null, tag: [], party: [] });
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

  // Initialize rule string from prop if provided (for quick rule modal)
  useEffect(() => {
    if (initialRuleString && !ruleString) {
      setRuleString(initialRuleString);
      setRuleData(prevState => ({ ...prevState, rule: initialRuleString }));
    }
  }, [initialRuleString]);

  // Focus and select the rule input text when in modal mode
  useEffect(() => {
    if (isModalMode && ruleInputRef.current) {
      ruleInputRef.current.focus();
      ruleInputRef.current.select();
    }
  }, [isModalMode, initialRuleString]);

  // Keeps ruleData in sync with the form. This is a bit ugly but will do for now.
  // Specifically, for the rule string we are going to debounce the update
  useDebounce(() => {
    setRuleData(prevState => ({ ...prevState, rule: ruleString }));
    if (firstUpdateCompleted.current) {
      updateRule(id, { rule: ruleString });
    }
    firstUpdateCompleted.current = true;
  }, 1500, [ruleString]);

  // tags
  const handleTagChange = selectedValues => {
    // const values = selectedValues.map(obj => obj.value);
    setTagData(selectedValues)
    setRuleData(prevState => ({ ...prevState, tag: selectedValues }));
  };

  const handleTagBlur = e => {
    updateRule(id, { tag: tagData });
  };

  // parties
  const handlePartyChange = selectedValues => {
    // const values = selectedValues.map(obj => obj.value);
    setPartyData(selectedValues)
    setRuleData(prevState => ({ ...prevState, party: selectedValues }));
  };

  const handlePartyBlur = e => {
    updateRule(id, { party: partyData });
  };

  async function createRule(evt) {
    evt.preventDefault();
    if (id) return;

    try {
      const { data, error } = await create(ruleData);

      if (error) {
        setError(error);
        return; // Stop processing if there's an error.
      }
      else {
        toast({ description: 'Rule created successfully', duration: 1000 });
        setError(null);
        
        // If in modal mode, call the onSaveComplete callback
        if (isModalMode && onSaveComplete) {
          onSaveComplete();
        } else {
          // Otherwise navigate to the rule edit page
          const newId = data?.id;
          await navigate({ to: '/rules/$ruleId', params: { ruleId: newId } });
        }
      }

    } catch (unexpectedError) {
      console.error("Unexpected error:", unexpectedError);
      setError("Unexpected error occurred");
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

    {/* Only show BackNav when not in modal mode */}
    {!isModalMode && <BackNav />}

    <div className={`flex justify-center ${isModalMode ? '' : 'gap-3'}`}>
      <Card className={`text-sm ${isModalMode ? 'w-full' : 'w-[550px]'}`}>
        <CardHeader>
          <CardTitle>{(effectiveRuleId === "new") ? "New Rule" : "Edit Rule"}</CardTitle>
          <CardDescription>
            When specific conditions occur, automatically add Tags or Merchants
          </CardDescription>
        </CardHeader>

        <CardContent>

          {error &&
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          }

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
                      ref={ruleInputRef}
                      value={ruleString}
                      name="rule"
                      onChange={event => setRuleString(event.target.value)}
                      autoComplete="off" />
                    {(transactionFetchError) &&
                      <div className="text-red-600 py-2">
                        {error ?? transactionFetchError?.response?.data?.error}
                      </div>
                    }
                  </div>
                  <div className="col-span-6 text-sm text-muted-foreground">
                    <p>description = 'Costco'</p>
                    <p>description = /^Costco.*Stuff/i (note the i for case insensitivity)</p>
                    <p>amount &gt; 50</p>
                    <p>account_number = /1547$/</p>
                    <p>description = 'Costco' AND amount &gt; 50</p>
                    <p>(description = 'direct' AND amount&gt;50) AND account_number = '1547'</p>
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
                  valueAsArray={tagData}
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
                  valueAsArray={partyData}
                  isMulti={false}
                  isCreatable={true}
                  coloredPills={true}
                  isClearable={true}
                  closeMenuOnSelect={true}
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
{/* Only show matching transactions when not in modal mode */}
{!isModalMode && (
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
)}
    </div>
  </>
  )
}