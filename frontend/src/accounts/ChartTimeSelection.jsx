import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

// Function to calculate the start date based on the selected period
const calculateStartDate = (period) => {
    const today = new Date();
    let newStartDate;

    switch (period) {
        case '5d':
            newStartDate = new Date(today.setDate(today.getDate() - 5));
            break;
        case '1m':
            newStartDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
        case '3m':
            newStartDate = new Date(today.setMonth(today.getMonth() - 3));
            break;
        case '1y':
            newStartDate = new Date(today.setFullYear(today.getFullYear() - 1));
            break;
        case '2y':
            newStartDate = new Date(today.setFullYear(today.getFullYear() - 2));
            break;
        case 'All':
            newStartDate = null; // Or set to the earliest date available
            break;
        default:
            newStartDate = null;
    }

    return newStartDate ? newStartDate.toISOString().split('T')[0] : null; // Format to 'YYYY-MM-DD'
};

const ChartTimeSelection = ({ onStartDateChange }) => {
    const periods = ['5d', '1m', '3m', '1y', '2y', 'All'];
    const defaultPeriod = '1y';
    const sd = calculateStartDate(defaultPeriod);
    
    const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
    
    useEffect(() => {
        if (onStartDateChange) {
            onStartDateChange(sd);
        }
    }, []); // Run on mount to send initial startDate

    const handleBadgeClick = (period) => {
        setSelectedPeriod(period);
        const calculatedStartDate = calculateStartDate(period);
        if (onStartDateChange) {
            onStartDateChange(calculatedStartDate);
        }
    };

    return (
        <div className="mt-2 mb-2">
            {periods.map((period) => (
                <button
                    key={period}
                    onClick={() => handleBadgeClick(period)}
                    className="mr-2"
                >
                    <Badge variant={selectedPeriod === period ? "default" : "secondary"}>
                        {period}
                    </Badge>
                </button>
            ))}
        </div>
    );
};

export default ChartTimeSelection;
