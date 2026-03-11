"use client";

import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "zh", labelKey: "common.zh" },
  { code: "en", labelKey: "common.en" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full", "border-sidebar-border", "bg-transparent", "h-10", "w-10", className)}
          aria-label={t("common.language")}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map(({ code, labelKey }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            className={cn(i18n.language === code && "bg-accent")}
          >
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
