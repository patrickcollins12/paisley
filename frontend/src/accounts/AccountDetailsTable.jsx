import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronRight, CirclePlus } from "lucide-react";
import { formatCamelCase } from "@/lib/utils";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
} from "@/components/ui/dialog"
import { AccountAddBalanceDialog } from "../account_add_balance/AccountAddBalanceDialog" // adjust path as needed

const AccountDetailsTable = ({ data }) => {
    const [showMetadata, setShowMetadata] = useState(false);

    const [balanceDialogOpen, setBalanceDialogOpen] = useState(false)

    // Parse `metadata` if it exists and is a valid JSON string
    let metaData = null;
    if (data?.metadata) {
        try {
            metaData = JSON.parse(data.metadata);
        } catch (error) {
            console.error("Failed to parse metadata:", error);
        }
    }

    // These keys are suppressed — they are either not needed or are shown elsewhere
    const suppressedKeys = new Set([
        "accountid",
        // "currency",
        // "shortname",
        "balance",
        "balance_datetime",
        "metadata",
    ]);

    if (!data) return null;

    const keysToDisplay = Object.keys(data).filter(
        (key) => !suppressedKeys.has(key)
    );

    return (
        <Card className="text-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Details</CardTitle>

                <div className="flex gap-2">
                    {data.accountid && (<>

                        {/* <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs gap-1"
                        >
                            <Link to={`/account_add_balance/${data.accountid}`}>
                                <CirclePlus className="h-4 w-4" />
                                Add Balance
                            </Link>
                        </Button> */}

                        <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs gap-1"
                                >
                                    <CirclePlus className="h-4 w-4" />
                                    Add Balance
                                </Button>
                            </DialogTrigger>

                            {balanceDialogOpen && (
                                <DialogContent >
                                    <AccountAddBalanceDialog
                                        key="balance-form"
                                        accountid={data.accountid}
                                        onSuccess={() => setBalanceDialogOpen(false)}
                                    />
                                </DialogContent>
                            )}
                        </Dialog>


                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs gap-1"
                        >
                            <Link to={`/account_edit/${data.accountid}`}>
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </>)}
                </div>
            </CardHeader>

            <CardContent>
                <table className="table-fixed">
                    <tbody>
                        {keysToDisplay.map((key) => {
                            const value = data[key] ?? "";

                            return (
                                <tr key={key}>
                                    <td className="font-bold pr-3 whitespace-nowrap">
                                        {formatCamelCase(key)}
                                    </td>
                                    <td className="break-words break-all w-full m-1">
                                        {String(value)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Meta Data Section */}
                {metaData && (
                    <div className="mt-4">
                        <button
                            className="flex items-center gap-1 text-sm hover:text-foreground transition"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMetadata(!showMetadata);
                            }}
                        >
                            <ChevronRight
                                size={16}
                                className={`transition-transform duration-200 ${showMetadata ? "rotate-90" : ""}`}
                            />
                            Additional Metadata
                        </button>

                        {showMetadata && (
                            <div className="mt-2">
                                <table className="table-auto">
                                    <tbody>
                                        {Object.entries(metaData).map(([key, value]) => (
                                            <tr key={key}>
                                                <td className="font-bold pr-3 whitespace-nowrap">
                                                    {formatCamelCase(key)}
                                                </td>
                                                <td className="break-words break-all">{String(value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card >
    );
};

export default AccountDetailsTable;
