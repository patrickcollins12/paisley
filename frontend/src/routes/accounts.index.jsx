import { createFileRoute } from '@tanstack/react-router'
import AccountsPage from '@/accounts/AccountsPage.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'

export const Route = createAuthenticatedFileRoute('/accounts/', {
  component: AccountsPage,
})
