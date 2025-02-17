import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CircleUser } from "lucide-react"

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from "@/components/ui/toaster.jsx"
import { useAuth } from "@/auth/AuthContext.jsx"

export const Route = createRootRoute({
  component: Root
});

function Root() {
  const authContext = useAuth();

  async function handleLogout(event) {
    event.preventDefault();
    await authContext.logout();
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {authContext.isAuthenticated &&
        <header className="top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <nav
            className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link to="/transactions" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
              Transactions
            </Link>
            <Link to="/accounts" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
              Accounts
            </Link>
            <Link to="/rules" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
              Rules
            </Link>
            <Link to="/visualise" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
              Visualise
            </Link>
          </nav>
          <div className="flex flex-row w-full items-center gap-3 md:ml-auto md:gap-2 lg:gap-2">
            <form className="ml-auto flex-1 sm:flex-initial">
            </form>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <CircleUser size={20}/>
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account ({authContext.username})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/settings" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link onClick={handleLogout}>Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      }

      <div className="flex-auto p-4 bg-muted/40">
        <Outlet />
      </div>

      <Toaster />
      <TanStackRouterDevtools />
    </ThemeProvider>
  )
}