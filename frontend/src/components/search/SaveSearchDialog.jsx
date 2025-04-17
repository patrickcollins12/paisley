import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveSearchDialog({ isOpen, onOpenChange, onSave, defaultName = '' }) {
    const [name, setName] = useState(defaultName);

    // Update local state if defaultName prop changes (e.g., if we later add edit functionality)
    useEffect(() => {
        setName(defaultName);
    }, [defaultName]);

    const handleSave = () => {
        if (name.trim()) { // Only save if name is not empty
            onSave(name.trim());
            onOpenChange(false); // Close dialog on save
        } else {
            // Optionally, add validation feedback (e.g., highlight input)
            console.warn('Save name cannot be empty');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    // Reset name when dialog opens/closes to avoid stale data
    useEffect(() => {
        if (isOpen) {
            setName(defaultName);
        } else {
            setName(''); // Clear name when closing
        }
    }, [isOpen, defaultName]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Filter Set</DialogTitle>
                    <DialogDescription>
                        Enter a name for this filter configuration to save it for later use.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Monthly Expenses"
                            data-1p-ignore
                            autoComplete="off"

                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Filter Set</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 