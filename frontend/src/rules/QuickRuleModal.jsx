import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input.jsx"
import { ReactSelect } from "@/components/ReactSelect.jsx"
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { Button } from "@/components/ui/button.jsx"
import { useToast } from "@/components/ui/use-toast.js"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUpdateRules } from "@/rules/RuleApiHooks.jsx"

export default function QuickRuleModal({ initialRuleString = '', onSaveComplete = null }) {
  const { toast } = useToast();
  
  // Create a ref for the rule input field to focus it
  const ruleInputRef = useRef(null);
  
  // Form state
  const [ruleData, setRuleData] = useState({ rule: initialRuleString, tag: [], party: [] });
  const [tagData, setTagData] = useState([]);
  const [partyData, setPartyData] = useState([]);
  const [ruleString, setRuleString] = useState(initialRuleString);
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // API hooks
  const { create } = useUpdateRules();
  
  // Focus and select the rule input text when the component mounts
  useEffect(() => {
    if (ruleInputRef.current) {
      ruleInputRef.current.focus();
      ruleInputRef.current.select();
    }
  }, []);
  
  // Update rule string when initialRuleString changes
  useEffect(() => {
    setRuleString(initialRuleString);
    setRuleData(prevState => ({ ...prevState, rule: initialRuleString }));
  }, [initialRuleString]);
  
  // Tags handlers
  const handleTagChange = selectedValues => {
    setTagData(selectedValues);
    setRuleData(prevState => ({ ...prevState, tag: selectedValues }));
  };
  
  // Parties handlers
  const handlePartyChange = selectedValues => {
    setPartyData(selectedValues);
    setRuleData(prevState => ({ ...prevState, party: selectedValues }));
  };
  
  // Create rule handler
  async function createRule(evt) {
    evt.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await create(ruleData);
      
      if (error) {
        setError(error);
        setIsSubmitting(false);
        return;
      } else {
        toast({ description: 'Rule created successfully', duration: 1000 });
        setError(null);
        
        // Add a small delay to ensure the rule is fully processed
        // before closing the modal and refreshing the transaction list
        setTimeout(() => {
          // Call the onSaveComplete callback
          if (onSaveComplete) {
            onSaveComplete();
          }
          setIsSubmitting(false);
        }, 300);
      }
    } catch (unexpectedError) {
      console.error("Unexpected error:", unexpectedError);
      setError("Unexpected error occurred");
      setIsSubmitting(false);
    }
  }
  
  return (
    <Card className="text-sm w-full">
      <CardHeader>
        <CardTitle>New Quick Rule</CardTitle>
        <CardDescription>
          When specific conditions occur, automatically add Tags or Merchants
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={createRule}>
          <div className="flex flex-col gap-3">
            <div>
              <div className="py-2 text-sm text-muted-foreground">
                When these conditions match ...
              </div>
              
              <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-3 items-center">
                <div className="col-span-6">
                  <Input
                    ref={ruleInputRef}
                    value={ruleString}
                    name="rule"
                    onChange={event => {
                      setRuleString(event.target.value);
                      setRuleData(prevState => ({ ...prevState, rule: event.target.value }));
                    }}
                    autoComplete="off"
                  />
                </div>
                <div className="col-span-6 text-sm text-muted-foreground">
                  <p>description = 'Costco'</p>
                  <p>description = /^Costco.*Stuff/i (note the i for case insensitivity)</p>
                  <p>amount &gt; 50</p>
                  <p>account_number = /1547$/</p>
                  <p>description = 'Costco' AND amount &gt; 50</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="py-2 text-sm text-muted-foreground">
                Add these tags
              </div>
              <ReactSelect
                onChange={handleTagChange}
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
            
            <div className="flex justify-between">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}