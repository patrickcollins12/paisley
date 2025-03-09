import { createFileRoute } from '@tanstack/react-router'
import SettingsPage from '@/settings/SettingsPage.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'

export const Route = createAuthenticatedFileRoute('/settings/', {
  component: SettingsPage,
})
