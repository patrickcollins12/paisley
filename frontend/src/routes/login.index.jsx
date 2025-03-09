import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '@/auth/LoginPage.jsx'

export const Route = createFileRoute('/login/')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw new redirect({ to: '/transactions' })
    }
  },
})
