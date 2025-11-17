import { createContext, useContext, type ReactNode } from "react";
import type { ResolvedTheme, Theme } from "./theme-utils";
import { useThemeProvider } from "./useThemeProvider";

export type { ResolvedTheme, Theme };

/**
 * Theme context value
 */
export type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Props
 */
export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
};

/**
 * Theme Provider Component
 *
 * Requirement 13: Theme system with light/dark modes
 * - Detects system color scheme preference
 * - Persists theme choice in localStorage
 * - Applies theme to document root
 */
export const ThemeProvider = ({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) => {
  const value = useThemeProvider(defaultTheme);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 *
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
