import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import useAccountInterestChanges from "@/accounts/AccountInterestApiHooks.js";
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';

const AccountInterestTable = ({ accountId, category, startDate }) => {
    // Fetch data using the custom hook
    const { data, error, isLoading } = useAccountInterestChanges(accountId, startDate);

    return (
        <>
            {data && (<>
                <div className="overflow-auto inline-block">

                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Date</th>
                                <th className="text-right">Interest</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    <td className="text-left">
                                        <DateTimeDisplay datetime={row.datetime} options={{ absolute: true }} />
                                    </td>
                                    <td className="text-right">{row.interest * 100}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>)}
        </>
    )
};

export default AccountInterestTable;
