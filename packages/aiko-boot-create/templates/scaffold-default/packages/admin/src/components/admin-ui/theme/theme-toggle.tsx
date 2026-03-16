"use client";

import { useTheme } from "@/components/admin-ui/theme/theme-provider";
import type { Appearance } from "@/components/admin-ui/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { appearance, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleAppearance = () => {
    const next: Appearance =
      appearance === "light"
        ? "dark"
        : appearance === "dark"
          ? "system"
          : "light";
    setTheme({ appearance: next });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleAppearance}
      className={cn(
        "rounded-full",
        "border-sidebar-border",
        "bg-transparent",
        className,
        "h-10",
        "w-10"
      )}
    >
      <Sun
        className={cn(
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-0",
          "scale-100",
          "transition-all",
          "duration-200",
          {
            "-rotate-90 scale-0": appearance === "dark" || appearance === "system",
          }
        )}
      />
      <Moon
        className={cn(
          "absolute",
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-90",
          "scale-0",
          "transition-all",
          "duration-200",
          {
            "rotate-0 scale-100": appearance === "dark",
            "rotate-90 scale-0": appearance === "light" || appearance === "system",
          }
        )}
      />
      <Monitor
        className={cn(
          "absolute",
          "h-[1.2rem]",
          "w-[1.2rem]",
          "rotate-0",
          "scale-0",
          "transition-all",
          "duration-200",
          {
            "scale-100": appearance === "system",
            "scale-0": appearance === "light" || appearance === "dark",
          }
        )}
      />
      <span className="sr-only">{t("theme.toggleLabel")}</span>
    </Button>
  );
}

ThemeToggle.displayName = "ThemeToggle";
