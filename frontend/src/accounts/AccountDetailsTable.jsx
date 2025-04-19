import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronRight, CirclePlus, RefreshCw, MoreHorizontal, Trash2 } from "lucide-react";
import { formatCamelCase } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import httpClient from "@/lib/httpClient.js";
import useAccountHistoryData from "./AccountHistoryApiHooks";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
} from "@/components/ui/dialog"

import { AccountAddBalanceDialog } from "../account_add_balance/AccountAddBalanceDialog" // adjust path as needed
import { AccountDeleteDialogContent } from "./AccountDeleteDialogContent";

const AccountDetailsTable = ({ data }) => {
    const { toast } = useToast();
    const [showMetadata, setShowMetadata] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { mutate: mutateHistory } = useAccountHistoryData({ accountid: data?.accountid });

    // Parse `metadata` if it exists, is not empty, and represents a non-empty object or array
    let parsedMetadata = null;
    if (data?.metadata?.trim()) { // Check if string exists and is not empty/whitespace
        try {
            const tempParsed = JSON.parse(data.metadata);

            // Check if it's an object with keys OR an array with length
            if (tempParsed && typeof tempParsed === 'object' &&
                ((Array.isArray(tempParsed) && tempParsed.length > 0) ||
                    (!Array.isArray(tempParsed) && Object.keys(tempParsed).length > 0))) {
                parsedMetadata = tempParsed;
            }
        } catch (error) {
            console.error("Failed to parse metadata:", error);
        }
    }

    // These keys are suppressed — they are either not needed or are shown elsewhere
    const suppressedKeys = new Set([
        "accountid",
        // "currency",
        // "shortname",
        "children",
        "hasChildren",
        "balance",
        "balance_datetime",
        "metadata", // Keep original metadata suppressed
    ]);

    if (!data) return null;

    const keysToDisplay = Object.keys(data).filter(
        (key) => !suppressedKeys.has(key)
    );

    // Function to call the new backend endpoint
    const handleRefreshHistory = async () => {
        if (!data.accountid) return;
        setIsRefreshing(true);
        try {
            const response = await httpClient.post(`account_history/${data.accountid}/recreate`);
            toast({
                title: "Success",
                description: response.data.message || "Account history refresh initiated.",
            });
            // Revalidate the history data after successful initiation
            mutateHistory();
        } catch (error) {
            console.error("Failed to refresh account history:", error);
            toast({
                variant: "destructive",
                title: "Error Refreshing History",
                description: error.response?.data?.error || error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDeleteSuccess = () => {
        setDeleteDialogOpen(false);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    return (
        <Card className="text-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Details</CardTitle>

                {/* Ellipsis Dropdown Menu */}
                {data.accountid && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => setBalanceDialogOpen(true)}
                            >
                                <CirclePlus className="mr-2 h-4 w-4" />
                                <span>Record a balance</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to={`/account_edit/${data.accountid}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Edit Account Details</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={handleRefreshHistory}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                <span>Recalculate Balance History</span>
                            </DropdownMenuItem>

                            {/* Delete Account Item (Triggers Dialog via state) */}
                            <DropdownMenuItem 
                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                // Use onSelect to set state, Dialog component is rendered elsewhere
                                onSelect={(event) => { 
                                    event.preventDefault(); // Prevent closing menu 
                                    setDeleteDialogOpen(true); 
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Account...</span>
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
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
                {parsedMetadata && ( // Use the new variable here
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
                                        {Object.entries(parsedMetadata).map(([key, value]) => ( // Use the new variable here
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

            <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
                {balanceDialogOpen && (
                    <DialogContent>
                        <AccountAddBalanceDialog
                            key="balance-form"
                            accountid={data?.accountid}
                            onSuccess={() => setBalanceDialogOpen(false)}
                        />
                    </DialogContent>
                )}
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                {deleteDialogOpen && (
                    <DialogContent>
                        <AccountDeleteDialogContent
                            accountid={data?.accountid}
                            name={data?.name}
                            onSuccess={handleDeleteSuccess}
                            onCancel={handleDeleteCancel}
                        />
                    </DialogContent>
                )}
            </Dialog>

        </Card >
    );
};

export default AccountDetailsTable;
