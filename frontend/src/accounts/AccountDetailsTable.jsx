import React from "react";
import { formatCamelCase } from "@/lib/utils";
import { EditableInput } from '@/components/EditableInput.jsx';
import { useUpdateAccounts } from "@/accounts/AccountApiHooks.js";
import { useToast } from "@/components/ui/use-toast.js"

const AccountDetailsTable = ({ data }) => {

    const { update, remove } = useUpdateAccounts();
    const { toast } = useToast();

    // Parse `meta` if it exists and is a valid JSON string
    let metaData = null;
    if (data?.metadata) {
        try {
            metaData = JSON.parse(data.metadata);
        } catch (error) {
            console.error("Failed to parse meta:", error);
        }
    }

    async function updateAccounts(id, dataToSave) {
        if (!id) return;

        try {
            await update(id, dataToSave);
            toast({ description: 'Account update successfully', duration: 2000 });
            //   await mutate();
        } catch (error) {
            //   setError(error?.response?.data?.error ?? null);
            console.error('Error saving account:', error);
        }
    }

    function onBlur(event, key) {
        const newVal = event.target.value.trim()
        const currentVal = data[key];  // Get the current value from data

        // setHasBeenEdited(newVal !== "" && newVal !== initialDescription);
        if (newVal !== currentVal) {
            const objToSave = { [key]: newVal }
            updateAccounts(data.accountid, objToSave)
        }
    }

    const suppressedKeys = new Set([
        "accountid",
        // "currency",
        // "shortname",
        "balance",
        "balance_datetime",
        "metadata"
    ]);

    const editableKeys = [
        "shortname",
        "institution",
        "name",
        "holders",
        "currency",
        "type",
        "timezone",
        "parentid",
        "status",
        "category"
    ];

    if (!data) {
        return null
    }

    const extendedKeysSet = new Set([
        ...editableKeys,       // Keys from editableKeys
        ...Object.keys(data),  // Keys from data
    ]);
    const keysToDisplay = [...extendedKeysSet]
        .filter(key => !suppressedKeys.has(key))  // Filter keys and check for values in data

    return (
        <div>
            <table className="table-fixed">
                <tbody>
                    {keysToDisplay.map(key => {
                        const value = data[key] || "";

                        return <tr key={key}>
                            <td className="font-bold pr-3 whitespace-nowrap">{formatCamelCase(key)}</td>
                            <td className="break-words break-all w-full">
                                {/* {String(value)} */}

                                {/* if editable */}
                                {editableKeys.includes(key) ?
                                    <EditableInput
                                        value={String(value)}
                                        spellCheck="false"
                                        className=" grow "
                                        key={key}
                                        // onKeyDown={onKeyDown}
                                        // onFocus={() => setIsFocused(true)}
                                        // onInput={handleChange}
                                        // onBlur={onBlur}
                                        onBlur={(event) => onBlur(event, key)}  // Pass `key` to `onBlur`
                                    />
                                    :
                                    <div className="m-1">{value}</div>
                                }
                            </td>

                        </tr>
                    }
                    )}
                </tbody>
            </table>

            {/* Meta Data Table */}
            {metaData && (
                <div className="mt-5">
                    <h3 className="font-bold">Additional Metadata</h3>
                    <table className="table-auto">
                        <tbody>
                            {Object.entries(metaData).map(([key, value]) => (
                                <tr key={key}>
                                    <td className="font-bold pr-3 whitespace-nowrap">{formatCamelCase(key)}</td>
                                    <td className="break-words break-all">{String(value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AccountDetailsTable;
