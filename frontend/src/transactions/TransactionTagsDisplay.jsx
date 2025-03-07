import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from 'react';
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { Switch } from "@/components/ui/switch.jsx"
import { TagEditorPopover } from "@/components/TagEditorPopover"
import { Link } from "@tanstack/react-router"
import { CircleChevronRight } from "lucide-react";


export function TransactionTagsDisplay({ type, data, manual, auto, rules, full, updateHandler, ...props }) {
    const id = data.id;

    // both need to be valid arrays
    if (!(Array.isArray(auto) && Array.isArray(manual))) {
        return (<div>tag array retrieval error</div>)
    }

    const [autoCategorize, setAutoCategorize] = useState(data.auto_categorize);
    const [autoTags, setAutoTags] = useState(auto);
    const [manualTags, setManualTags] = useState(manual);
    const [tags, setTags] = useState(full);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const toggleRulesVisibility = () => { setIsRulesOpen(!isRulesOpen); };

    // const displayedTags = autoCategorize ? [...new Set([...manualTags, ...autoTags])] : [...manualTags];
    const { data: allTags } = useFetchTags(type); // for the select dropdown

    // handle props updates
    useEffect(() => {
        setAutoTags(auto);
        setManualTags(manual);
        setTags(full);
        setAutoCategorize(autoCategorize);
    }, [manual, auto]);

    // handle the logic when autocatorization is switched on and off
    function handleAutoCategorizeChange(_autoCategorize) {

        // populated with the final set of manual tags depending on what the new value of auto categorize is
        let updatedManualTags = [];

        // OK this logic is not trivial, so i'll describe it.
        // When turning off auto categorization, we want to take the existing
        // automatically created tags and move them over to the manual tags, so you can edit them.

        if (!_autoCategorize) {
            updatedManualTags = [...new Set([...manualTags, ...autoTags])];
        }


        // but when turning automatic tagging back on, we want to do the opposite,
        // we want to take whatever manually created tags are already covered by
        // the auto tagging and remove them from the set.
        // It's basically a set difference, where we're subtracting autoTags
        // from manualTags and then setting that back to manualTags
        else {
            const manualTagsSet = new Set(manualTags);
            const autoTagsSet = new Set(autoTags);

            // Subtract autoTags from manualTags
            const difference = new Set([...manualTagsSet].filter(x => !autoTagsSet.has(x)));

            // Update state with the result
            updatedManualTags = [...difference];
        }



        // build up new transaction state and call onUpdate handler
        // new transaction state should only contain the things that have actually changed
        let updatedTransaction;
        //  = {
        //     auto_categorize: _autoCategorize,
        //     manual_tags: [...updatedManualTags]
        // };

        if (type == "tags") {
            updatedTransaction = {
                auto_categorize: _autoCategorize,
                manual_tags: [...updatedManualTags]
            };
        } else {
            updatedTransaction = {
                auto_categorize: _autoCategorize,
                manual_party: [...updatedManualTags]
            };
        }

        updateHandler(id, updatedTransaction);

        setAutoCategorize(_autoCategorize);
        // console.log(`_autoCategorize: ${_autoCategorize}, manualTags: ${manualTags}, autoTags: ${autoTags}, updatedManualTags: ${updatedManualTags}`)

        setManualTags(updatedManualTags);
    }

    function _localUpdateHandler(values) {

        // console.log(JSON.stringify(selectedValues, null, "\t"))
        // let values = selectedValues
        // if (Array.isArray(selectedValues)) {
        //     values = selectedValues.map(obj => obj.value);
        // } else if (typeof selectedValues === 'object' && selectedValues !== null) {
        //     values = [selectedValues.value];
        // }

        // console.log(values);
        // build up new transaction state and call onUpdate handler
        // new transaction state should only contain the things that have actually changed
        let updatedTransaction

        if (type == "tags") {
            updatedTransaction = { manual_tags: [...values] };
        } else {
            updatedTransaction = { manual_party: [...values] };
        }

        updateHandler(id, updatedTransaction);

        if (autoCategorize) {
            const displayTags = [...new Set([...values, ...autoTags])];
            setTags(displayTags)
        } else {
            setTags(values)
        }

        setManualTags(values); // <--HERE
    }

    const contentHeader = (
        <>
            {/* ---- Autocategorize Switch ---- */}
            < div className="flex items-center space-x-2 mb-2" >

                <Switch
                    className="text-xs"
                    checked={autoCategorize}
                    onCheckedChange={handleAutoCategorizeChange}
                />

                <div className="text-xs">Auto categorize is {autoCategorize ? "on" : "off"}</div>
            </div >

            {/* ---- Show Categorized Tags ---- */}
            {
                autoCategorize && autoTags.length ? (
                    <>
                        <div className="text-xs pr-1 mb-1">Auto tags</div>

                        <div className="inline-flex items-center mb-1">
                            <span>
                                {autoTags.map((tag, index) => (
                                    <Badge
                                        className="mb-0"
                                        variant="colored"
                                        key={index}>{tag}
                                    </Badge>
                                ))}
                            </span>

                            <button onClick={toggleRulesVisibility} className="text-xs font-normal hover:cursor-pointer">
                                <CircleChevronRight
                                    size={16}
                                    className={`transform transition-transform ${isRulesOpen ? 'rotate-90' : ''}`}
                                />
                            </button>

                        </div>

                        {isRulesOpen && (
                            <div className="mb-1">

                                <span className="text-xs">
                                    Auto-tagged by {rules.length > 1 ? ' rules ' : ' rule '}
                                </span>
                                <span className="text-xs">

                                    {rules.map((rule, index) => (
                                        <span className="text-xs" key={index}>
                                            {index > 0 && ', '}
                                            <Link to={`/rules/${rule}`} className="underline">{rule}</Link>
                                        </span>
                                    ))}
                                </span>

                            </div>)
                        }
                    </>
                ) : ""

            }
        </>
    )



    return (
        <TagEditorPopover
            values={manualTags}
            allValues={allTags}
            updateHandler={_localUpdateHandler}
            cellValues={tags}
            contentHeader={contentHeader}
            {...props}
        />
    );

}
