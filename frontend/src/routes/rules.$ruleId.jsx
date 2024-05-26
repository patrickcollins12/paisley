import { createFileRoute } from '@tanstack/react-router'

import RuleEditPage from "@/rules/RuleEditPage.jsx"
import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx"

export const Route = createAuthenticatedFileRoute('/rules/$ruleId', {
  component: RuleEditPage
});