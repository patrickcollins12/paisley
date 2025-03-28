import { createFileRoute } from '@tanstack/react-router'
import {AccountEditForm} from '@/account_edit/AccountEditForm.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'

export const Route = createAuthenticatedFileRoute('/account_edit/$accountId', {
  component: AccountEditForm,
})
