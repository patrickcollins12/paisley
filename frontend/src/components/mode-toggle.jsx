import { Moon, Sun, CircleCheckBig } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/components/theme-provider";
import { useTranslation } from 'react-i18next';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  function renderThemeIcon(label, renderTheme) {
    return (
      <DropdownMenuItem onClick={() => setTheme(renderTheme)}>
        <div className="flex items-center justify-between w-full">
          <span>{label}</span>
          <span>{renderTheme === theme && <CircleCheckBig size={16} />}</span>
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8">
          <Sun className="h-[1.0rem] w-[1.0rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.0rem] w-[1.0rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {renderThemeIcon(t("Light"), "light")}
        {renderThemeIcon(t("Dark"), "dark")}
        {renderThemeIcon(t("System"), "system")}
      </DropdownMenuContent >
    </DropdownMenu >
  );
}