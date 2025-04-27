import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CircleUser, Menu } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"; // Adjust path if needed
import { AppSidebar } from "@/components/AppSidebar.jsx";

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from "@/components/ui/toaster.jsx"
import { useAuth } from "@/auth/AuthContext.jsx"

export const Route = createRootRoute({
  component: Root
});

function Root() {
  const authContext = useAuth();
  const { t, i18n } = useTranslation();

  async function handleLogout(event) {
    event.preventDefault();
    await authContext.logout();
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        {/* Sidebar Component - Managed by SidebarProvider */}
        {authContext.isAuthenticated && <AppSidebar />}

        {/* Main Content Area */}
        <SidebarInset>
          {authContext.isAuthenticated &&
            <header className="top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
              {/* Sidebar Trigger (Hamburger Menu) - Mobile Only */}
              <SidebarTrigger className="md:hidden" />
              
              {/* Top Navigation - Desktop Only */}
              <nav
                className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link to="/transactions" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                  {t('Transactions')}
                </Link>
                <Link to="/accounts" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                  {t('Accounts')}
                </Link>
                <Link to="/rules" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                  {t('Rules')}
                </Link>
                <Link to="/tags" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                  {t('Tags')}
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="link" className="text-muted-foreground hover:text-foreground p-0 font-medium md:text-sm">
                      {t('Visualize')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link to="/visualizetree" className="cursor-pointer w-full">
                        {t('Tree view')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/visualizetrend" className="cursor-pointer w-full">
                        {t('Trend over time')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
              
              {/* Right-aligned items (Search, Theme Toggle, User Menu) */}
              <div className="flex flex-row w-full items-center gap-3 md:ml-auto md:gap-2 lg:gap-2">
                <form className="ml-auto flex-1 sm:flex-initial">
                </form>
                <ModeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <CircleUser size={20} />
                      <span className="sr-only">{t('Toggle user menu')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('Account')} ({authContext.username})</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/settings" className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground">
                        {t('Settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link onClick={handleLogout}>{t('Logout')}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          }

          {/* Page Content */}
          <div className="flex-auto pt-4 sm:p-4 bg-muted/40">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Toaster />
      {/* <TanStackRouterDevtools /> */}
    </ThemeProvider>
  )
}