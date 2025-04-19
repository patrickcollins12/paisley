import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateAccounts } from "./AccountApiHooks";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Contains the content and logic *inside* the delete confirmation dialog
export function AccountDeleteDialogContent({ accountid, name, onSuccess, onCancel }) { 
    const { toast } = useToast();
    const navigate = useNavigate();
    const { remove: removeAccount } = useUpdateAccounts();

    // State is internal to the dialog content
    const [deleteAlsoData, setDeleteAlsoData] = useState(true); 
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (!accountid) return;
        setIsDeleting(true);
        try {
            const result = await removeAccount(accountid, deleteAlsoData);
            if (result.error) {
                throw new Error(result.error);
            }
            toast({
                title: "Success",
                description: result.data?.message || "Account deleted successfully.",
            });
            onSuccess(); // Call the success callback (closes dialog)
            navigate({ to: '/accounts' }); 
        } catch (error) {
            console.error("Failed to delete account:", error);
            toast({
                variant: "destructive",
                title: "Error Deleting Account",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete account '{name}' ({accountid})?
                    This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 my-4">
                <Checkbox
                    id={`deleteAlsoData-${accountid}`}
                    checked={deleteAlsoData}
                    onCheckedChange={setDeleteAlsoData}
                    disabled={isDeleting}
                />
                <Label htmlFor={`deleteAlsoData-${accountid}`}>Also delete transactions and account balances for this account</Label>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isDeleting} onClick={onCancel}>Cancel</Button> 
                </DialogClose>
                <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </DialogFooter>
        </>
    );
} 