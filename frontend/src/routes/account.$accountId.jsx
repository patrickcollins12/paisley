import { createFileRoute } from '@tanstack/react-router'
import AccountPage from "@/accounts/AccountPage.jsx"
import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx"

export const Route = createAuthenticatedFileRoute('/account/$accountId', {
  component: AccountPage
});