import React from "react";
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// You might need to wrap this content in a SheetContent or similar
// if the Sidebar component itself doesn't provide styling.
// This example assumes the SidebarProvider handles the layout.
export function AppSidebar() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col border-r bg-background p-4 text-xs">
      {/* Optional: Add a logo or title here */}
      <nav className="mt-4 flex flex-col gap-4 text-lg font-medium">
        <Link
          to="/transactions"
          className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Transactions')}
        </Link>
        <Link
          to="/accounts"
          className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Accounts')}
        </Link>
        <Link
          to="/rules"
          className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Rules')}
        </Link>
        <Link
          to="/tags"
          className="[&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Tags')}
        </Link>
        
        {/* Simple links for sidebar - Dropdown might be less ideal here */}
        <span className="font-semibold text-muted-foreground">{t('Visualize')}</span>
        <Link
          to="/visualize"
          className="ml-2 [&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Tree view')}
        </Link>
        <Link
          to="/visualizetrend"
          className="ml-2 [&.active]:text-foreground text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {t('Trend over time')}
        </Link>

        {/* Consider moving Settings/Logout here too if desired */}
      </nav>
    </div>
  );
} 