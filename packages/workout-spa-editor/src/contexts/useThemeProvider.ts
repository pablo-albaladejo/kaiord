import { useEffect, useState } from "react";

import {
  applyTheme,
  getStoredTheme,
  type ResolvedTheme,
  resolveTheme,
  storeTheme,
  type Theme,
} from "./theme-utils";

export const useThemeProvider = (defaultTheme: Theme = "system") => {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() ?? defaultTheme;
  });

  // Resolve theme to actual light/dark value
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme() ?? defaultTheme;
    return resolveTheme(initialTheme);
  });

  // Update theme and persist to localStorage. The document class flips
  // BEFORE the state update: consumers that read CSS custom properties
  // during render (uPlot option builders) must see the new variables on
  // the very render the resolved theme changes.
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
    const resolved = resolveTheme(newTheme);
    applyTheme(resolved);
    setResolvedTheme(resolved);
  };

  // Apply theme to document on mount and when resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? "dark" : "light";
      applyTheme(newResolvedTheme);
      setResolvedTheme(newResolvedTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
};
