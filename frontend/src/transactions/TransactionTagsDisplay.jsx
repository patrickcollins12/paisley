import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from 'react';
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { Switch } from "@/components/ui/switch.jsx"
import { TagEditorPopover } from "@/components/TagEditorPopover"
import { useUpdateEffect } from "react-use"

export function TransactionTagsDisplay({ type, data, manual, auto, full, updateHandler, ...props }) {
    const id = data.id;

    // both need to be valid arrays
    if (!(Array.isArray(auto) && Array.isArray(manual))) {
        return (<div>tag array retrieval error</div>)
    }

    const [autoCategorize, setAutoCategorize] = useState(data.auto_categorize);
    const [autoTags, setAutoTags] = useState(auto);
    const [manualTags, setManualTags] = useState(manual);
    const [tags, setTags] = useState(full);

    // const displayedTags = autoCategorize ? [...new Set([...manualTags, ...autoTags])] : [...manualTags];
    const { data: allTags } = useFetchTags(type); // for the select dropdown

    // handle props updates
    useEffect(() => {
        setAutoTags(auto);
        setManualTags(manual);
        setTags(full);
        setAutoCategorize(autoCategorize);
    }, [manual, auto, autoCategorize]);

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
        let updatedTransaction = {
            auto_categorize: _autoCategorize,
            manual_tags: [...updatedManualTags]
        };

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
        setManualTags(updatedManualTags);
    }

    function _localUpdateHandler(selectedValues) {

        // build up new transaction state and call onUpdate handler
        // new transaction state should only contain the things that have actually changed
        let updatedTransaction

        if (type == "tags") {
            updatedTransaction = { manual_tags: [...selectedValues] };
        } else {
            updatedTransaction = { manual_party: [...selectedValues] };
        }

        updateHandler(id, updatedTransaction);

        if (autoCategorize) {
            const displayTags = [...new Set([...selectedValues, ...autoTags])];
            setTags(displayTags)
        } else {
            setTags(selectedValues)
        }

        setManualTags(selectedValues);
    }

    const contentHeader = (
        <>
            {/* ---- Autocategorize Switch ---- */}
            < div className="flex items-center space-x-2 mb-3" >

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
                    <div className="items-center">
                        <div className="text-xs pr-1">Auto tags</div>
                        {autoTags.map((tag, index) => (
                            <Badge
                                variant="colored"
                                key={index}>{tag}
                            </Badge>
                        ))}
                    </div>
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
