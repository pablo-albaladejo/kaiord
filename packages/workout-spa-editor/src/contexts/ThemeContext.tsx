import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Theme types
 * Requirement 13: Support light, dark, kiroween, and system preference themes
 */
export type Theme = "light" | "dark" | "kiroween" | "system";

/**
 * Resolved theme (what's actually applied)
 */
export type ResolvedTheme = "light" | "dark" | "kiroween";

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
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = "workout-editor-theme";

/**
 * Get system theme preference
 */
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Get stored theme preference from localStorage
 */
const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      stored === "light" ||
      stored === "dark" ||
      stored === "kiroween" ||
      stored === "system"
    ) {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
  }

  return null;
};

/**
 * Store theme preference in localStorage
 */
const storeTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to store theme in localStorage:", error);
  }
};

/**
 * Resolve theme to actual light/dark value
 */
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};

/**
 * Apply theme to document
 */
const applyTheme = (resolvedTheme: ResolvedTheme): void => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  // Remove all theme classes
  root.classList.remove("dark", "kiroween");

  // Add appropriate theme class
  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else if (resolvedTheme === "kiroween") {
    root.classList.add("kiroween");
  }
};

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
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() ?? defaultTheme;
  });

  // Resolve theme to actual light/dark/kiroween value
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme() ?? defaultTheme;
    return resolveTheme(initialTheme);
  });

  // Update theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
    setResolvedTheme(resolveTheme(newTheme));
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
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
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

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

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
