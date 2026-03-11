"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Appearance = "light" | "dark" | "system";
export type Palette = "default" | "blue" | "green" | "violet" | "rose" | "amber" | "fiori";

export type ThemeState = {
  appearance: Appearance;
  palette: Palette;
  /** Resolved to "light" or "dark" for applying to DOM */
  resolvedAppearance: "light" | "dark";
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Partial<ThemeState>;
  storageKey?: string;
};

type ThemeProviderContextValue = ThemeState & {
  setTheme: (update: Partial<Pick<ThemeState, "appearance" | "palette">>) => void;
};

const defaultState: ThemeState = {
  appearance: "system",
  palette: "fiori",
  resolvedAppearance: "light",
};

const ThemeProviderContext = createContext<ThemeProviderContextValue | null>(
  null
);

function getStoredTheme(storageKey: string): Partial<ThemeState> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    if (["light", "dark", "system"].includes(raw)) {
      return { appearance: raw as Appearance };
    }
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      appearance:
        parsed.appearance && ["light", "dark", "system"].includes(parsed.appearance)
          ? parsed.appearance
          : undefined,
      palette:
        parsed.palette &&
        ["default", "blue", "green", "violet", "rose", "amber", "fiori"].includes(parsed.palette)
          ? parsed.palette
          : undefined,
    };
  } catch {
    return {};
  }
}

function resolveAppearance(appearance: Appearance): "light" | "dark" {
  if (appearance === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return appearance;
}

export function ThemeProvider({
  children,
  defaultTheme = {},
  storageKey = "app-theme",
  ...props
}: ThemeProviderProps) {
  const stored = getStoredTheme(storageKey);
  const [state, setState] = useState<ThemeState>(() => {
    const appearance = (stored.appearance ?? defaultTheme.appearance ?? "system") as Appearance;
    const palette = (stored.palette ?? defaultTheme.palette ?? "fiori") as Palette;
    const resolvedAppearance = resolveAppearance(appearance);
    return { appearance, palette, resolvedAppearance };
  });

  useEffect(() => {
    const appearance: Appearance = state.appearance;
    const resolved =
      appearance === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : appearance;
    setState((prev) =>
      prev.resolvedAppearance !== resolved
        ? { ...prev, resolvedAppearance: resolved }
        : prev
    );
  }, [state.appearance]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (state.appearance !== "system") return;
      setState((prev) => ({
        ...prev,
        resolvedAppearance: media.matches ? "dark" : "light",
      }));
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [state.appearance]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(state.resolvedAppearance);
    root.setAttribute("data-palette", state.palette);
  }, [state.resolvedAppearance, state.palette]);

  const setTheme = (update: Partial<Pick<ThemeState, "appearance" | "palette">>) => {
    setState((prev) => {
      const next = { ...prev };
      if (update.appearance !== undefined) {
        next.appearance = update.appearance;
        next.resolvedAppearance = resolveAppearance(update.appearance);
      }
      if (update.palette !== undefined) next.palette = update.palette;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            appearance: next.appearance,
            palette: next.palette,
          })
        );
      } catch {}
      return next;
    });
  };

  const value: ThemeProviderContextValue = { ...state, setTheme };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined || context === null) {
    console.error("useTheme must be used within a ThemeProvider");
    return {
      ...defaultState,
      setTheme: () => {},
    };
  }
  return context;
}

ThemeProvider.displayName = "ThemeProvider";
