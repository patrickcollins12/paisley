import React from "react";

const AccountDetailsTable = ({ data }) => {
    const suppressedKeys = new Set([
        "accountid",
        "currency",
        "shortname",
        "balance",
        "balance_datetime",
        "metadata"
    ]);

    // balance_datetime --> Balance Datetime
    // TimeZone --> Time Zone
    function formatCamelCase(str) {
        return str
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
            .toLowerCase()
            .replace(/(?:^|\s)\S/g, function (a) {
                return a.toUpperCase();
            });
    }

    // Parse `meta` if it exists and is a valid JSON string
    let metaData = null;
    if (data?.metadata) {
        try {
            metaData = JSON.parse(data.metadata);
        } catch (error) {
            console.error("Failed to parse meta:", error);
        }
    }

    return (
        <div>
            <table className="table-fixed">
                <tbody>
                    {data &&
                        Object.entries(data)
                            .filter(([key, value]) => !suppressedKeys.has(key) && value !== null)
                            .map(([key, value]) => (
                                <tr key={key}>
                                    <td className="font-bold pr-3 whitespace-nowrap">{formatCamelCase(key)}</td>
                                    <td className="break-words break-all">{String(value)}</td>
                                </tr>
                            ))}
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
