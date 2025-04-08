// AccountAddBalanceDialog.jsx
import React, { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import httpClient from "@/lib/httpClient" // adjust path if needed
import { useToast } from "@/components/ui/use-toast.js"

import {
    DialogTitle,
    DialogHeader,
    DialogDescription
} from "@/components/ui/dialog"

export function AccountAddBalanceDialog({ accountid, onSuccess }) {
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date())
    const [time, setTime] = useState(format(new Date(), "HH:mm"))
    const { toast } = useToast()

    function sanitizeAmount(input) {
        return input.replace(/[^0-9.-]+/g, "") // removes $, commas, etc.
    }

    const handleSubmit = async () => {
        const [hours, minutes] = time.split(":").map(Number)
        const combinedDate = new Date(date)
        combinedDate.setHours(hours)
        combinedDate.setMinutes(minutes)
        combinedDate.setSeconds(0)
        combinedDate.setMilliseconds(0)

        console.log("Account ID:", accountid)
        console.log("Amount:", amount)
        console.log("Balance as of:", combinedDate.toISOString())

        const cleanedAmount = sanitizeAmount(amount)
        const numericAmount = parseFloat(cleanedAmount)

        const isoDatetime = combinedDate.toISOString()
        const { data: result, error } = await saveBalance({
            accountid,
            balance: numericAmount,
            datetime: isoDatetime,
            data: { "from": "saved from user (X) on frontend" },
        })

        if (error) {
            // console.error("Failed to save balance:", error)
            toast({ description: error, duration: 2000, variant: "destructive" })
        } else {
            // console.log("Balance saved:", result)
            toast({ description: "Balance saved!", duration: 2000 })
            if (onSuccess) onSuccess()
        }
    }    // utils/accountBalanceApi.js or similar


    async function saveBalance({ accountid, datetime, balance, data }) {
        try {
            const response = await httpClient.post("account_balance", {
                accountid,
                datetime,
                balance,
                data,
            })

            return { data: response.data, error: null, isLoading: false }
        } catch (err) {
            const apiErrors = err.response?.data?.errors
            let errorMsg

            if (Array.isArray(apiErrors) && apiErrors.length > 0) {
                errorMsg = apiErrors.map((e) => `${e.path}: ${e.msg}`).join("\n")
            } else {
                errorMsg = err.response?.data?.message || err.message
            }

            return { data: null, error: errorMsg, isLoading: false }
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Record balance</DialogTitle>
                <DialogDescription>
                    Record a new balance as of a specific date and time.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">

                {/* Amount input */}
                <div className="text-sm">
                    <span className="font-medium">Account: </span>
                    <span className="">{accountid}</span>
                </div>

                <div>
                    <Label htmlFor="amount">Balance</Label>
                    <Input
                        id="amount"
                        // type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                {/* Balance as of */}
                <div className="grid gap-2">
                    <Label>As of</Label>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[200px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Time input */}
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-[120px]"
                        />
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <Button onClick={handleSubmit}>Submit</Button>
                </div>
            </div>
        </>
    )
}
