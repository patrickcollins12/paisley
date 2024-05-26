import { createFileRoute, Navigate } from '@tanstack/react-router'
import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx"

export const Route = createAuthenticatedFileRoute('/', {
  component: () => <Navigate to='/transactions' />
});