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
                                    <td className="font-bold pr-3">{key}</td>
                                    <td>{String(value)}</td>
                                </tr>
                            ))}
                </tbody>
            </table>


            {/* Meta Data Table */}
            {metaData && (
                <div className="mt-5">
                    <h3 className="font-bold">Additional Metadata</h3>
                    <table className="table-fixed">
                        <tbody>
                            {Object.entries(metaData).map(([key, value]) => (
                                <tr key={key}>
                                    <td className="font-bold pr-3">{key}</td>
                                    <td>{String(value)}</td>
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
