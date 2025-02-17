import React from "react";
import { getRouteApi, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"

const routeApi = getRouteApi('/account/$accountId');

const AccountPage = () => {

    // grab the path parameter from the URL
    const { accountId } = routeApi.useParams();

    return (
        <>
            <div className="pb-4 text-sm text-muted-foreground">
                <Link to="/accounts">
                    <div className="flex items-center">
                        <ChevronLeft size={16} />
                        <div>Back</div>
                    </div>
                </Link>
            </div>

            <Card className="text-sm w-[550px]">
                <CardHeader>
                    <CardTitle>Account Name Here</CardTitle>
                    <CardDescription>
                        Account# {accountId}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    This page needs a:
                    <ul>
                        <li>Nice summary card with balance</li>
                        <li>Editable fields</li>
                        <li>Balance trend</li>
                        <li>Interest trend</li>
                        <li>10 most recent transactions with a link to Transactions page</li>
                    </ul>
                </CardContent>
            </Card>

        </>
    )
};

export default AccountPage;
