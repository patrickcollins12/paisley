import React, { useState, useRef } from 'react';
import { EditableInput } from '@/components/EditableInput.jsx';
import { useUpdateTransaction } from "@/transactions/TransactionApiHooks.jsx"

export function EditableDescriptionCell({ row, columnId, table }) {

    // Initialization
    const index = row.index;
    const initialDescription = row.original.orig_description;
    const revisedDescription = row.original.revised_description;

    let initialEditFieldValue = initialDescription;
    let initialEditState = false;

    if (revisedDescription && revisedDescription !== initialDescription) {
        initialEditFieldValue = revisedDescription;
        initialEditState = true;
    }

    // Setup all React Refs and States.
    const [hasBeenEdited, setHasBeenEdited] = useState(initialEditState);
    const [isFocused, setIsFocused] = useState(false);
    const [editFieldValue, setEditFieldValue] = useState(initialEditFieldValue);
    const revertedWasClickedRef = useRef(false);

    // Load the method to update the transaction
    const { update: updateTransaction } = useUpdateTransaction();

    function sanitize(value) {
        return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function onKeyDown(event) {
        if (event.shiftKey && event.key === 'Enter') {
            // Allow Shift+Enter to insert newline without interfering
            return;
        }
        if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault();
            event.currentTarget.blur();
        }
    }

    function handleChange(event) {
        const newVal = event.target.value.trim();
        setHasBeenEdited(newVal !== "" && newVal !== initialDescription);
    }

    function saveDescription(newVal) {
        console.log(JSON.stringify(table.options.meta,null,"\t"))
        table.options.meta?.updateData(index, columnId, newVal);
        updateTransaction(row.original.id, { description: sanitize(newVal) }).then(success => {
            if (success) console.log('Transaction successfully updated');
        });
    }

    function onBlur(event) {
        setTimeout(() => {
            if (revertedWasClickedRef.current) {
                // console.log("Skipping blur save")
                revertedWasClickedRef.current = false;
            } else {
                // setRevertedWasClicked(false)
                setIsFocused(false);

                let newVal = event.target.value.trim() || initialDescription;
                const isEdited = newVal !== initialEditFieldValue;
                setHasBeenEdited(isEdited);

                if (isEdited) {
                    setEditFieldValue(newVal);
                    saveDescription(newVal)
                }

            }
        }, 200)

    }

    function revertChanges() {
        revertedWasClickedRef.current = true;
        console.log(`Reverting to ${initialDescription}. ${revertedWasClickedRef}`)
        setIsFocused(false)
        setEditFieldValue(initialDescription)
        setHasBeenEdited(false);
        saveDescription("")
    }

    return (
        <>
            <div className="flex items-center">
                <EditableInput
                    value={editFieldValue}
                    spellCheck="false"
                    className=" grow "
                    onKeyDown={onKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onInput={handleChange}
                    onBlur={onBlur}
                />
            </div>
            <div className="">
                {hasBeenEdited && !isFocused && (
                    <span className="pl-1 text-muted-foreground italic">(edited)</span>
                )}
                {hasBeenEdited && isFocused && (
                    <>
                    <span className="text-xs pl-1 text-muted-foreground mt-1">{initialDescription}</span>
                    <span className="text-xs pl-1 italic text-muted-foreground">
                        <a
                            href="#"
                            className="underline"
                            onClick={(e) => { e.preventDefault(); revertChanges(); }}>
                            revert
                        </a>

                    </span>
                    </>
                )}
                
            </div>

        </>
    );
}


