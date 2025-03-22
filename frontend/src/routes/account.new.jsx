import { createFileRoute } from '@tanstack/react-router'
import {AccountCreatePage} from '@/accounts/AccountCreatePage.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'

export const Route = createAuthenticatedFileRoute('/account/new', {
  component: AccountCreatePage,
})
