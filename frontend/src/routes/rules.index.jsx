import { createFileRoute } from '@tanstack/react-router'
import RulePage from '@/rules/RulePage.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'

export const Route = createAuthenticatedFileRoute('/rules/', {
  component: RulePage,
})
