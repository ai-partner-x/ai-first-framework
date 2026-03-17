"use client";

import React from "react";
import { useTheme } from "./theme-provider";
import type { Appearance, Palette } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, ChevronDown, Check, Palette as PaletteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const appearanceOptions: { value: Appearance; labelKey: string; icon: React.ReactNode }[] = [
  { value: "light", labelKey: "theme.light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", labelKey: "theme.dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", labelKey: "theme.system", icon: <Monitor className="h-4 w-4" /> },
];

const paletteOptions: { value: Palette; labelKey: string; color: string }[] = [
  { value: "default", labelKey: "theme.palette.default", color: "oklch(0.55 0 0)" },
  { value: "blue", labelKey: "theme.palette.blue", color: "oklch(0.55 0.22 264)" },
  { value: "green", labelKey: "theme.palette.green", color: "oklch(0.55 0.18 142)" },
  { value: "violet", labelKey: "theme.palette.violet", color: "oklch(0.55 0.26 293)" },
  { value: "rose", labelKey: "theme.palette.rose", color: "oklch(0.58 0.25 27)" },
  { value: "amber", labelKey: "theme.palette.amber", color: "oklch(0.58 0.2 75)" },
  { value: "fiori", labelKey: "theme.palette.fiori", color: "rgb(0 112 242)" },
];

export function ThemeSelect() {
  const { appearance, palette, setTheme } = useTheme();
  const { t } = useTranslation();

  const currentAppearance = appearanceOptions.find((o) => o.value === appearance);
  const currentPalette = paletteOptions.find((o) => o.value === palette);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className={cn(
            "w-full",
            "justify-between",
            "px-3",
            "text-left",
            "text-sm",
            "font-normal",
            "text-foreground",
            "hover:bg-accent",
            "hover:text-accent-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-ring"
          )}
        >
          <div className="flex items-center gap-2">
            {currentAppearance?.icon}
            <span>{currentAppearance ? t(currentAppearance.labelKey) : ""}</span>
            <span className="text-muted-foreground">/</span>
            <span className="truncate">
              {currentPalette ? t(currentPalette.labelKey) : ""}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 space-y-1">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {t("theme.appearance")}
        </DropdownMenuLabel>
        {appearanceOptions.map((option) => {
          const isSelected = appearance === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme({ appearance: option.value })}
              className={cn(
                "flex items-center gap-2 cursor-pointer relative pr-8",
                { "bg-accent text-accent-foreground": isSelected }
              )}
            >
              {option.icon}
              <span>{t(option.labelKey)}</span>
              {isSelected && (
                <Check className="h-4 w-4 absolute right-2 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal flex items-center gap-1.5">
          <PaletteIcon className="h-3.5 w-3.5" />
          {t("theme.paletteLabel")}
        </DropdownMenuLabel>
        {paletteOptions.map((option) => {
          const isSelected = palette === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme({ palette: option.value })}
              className={cn(
                "flex items-center gap-2 cursor-pointer relative pr-8",
                { "bg-accent text-accent-foreground": isSelected }
              )}
            >
              <span
                className="h-4 w-4 rounded-full border border-border shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <span>{t(option.labelKey)}</span>
              {isSelected && (
                <Check className="h-4 w-4 absolute right-2 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

ThemeSelect.displayName = "ThemeSelect";
