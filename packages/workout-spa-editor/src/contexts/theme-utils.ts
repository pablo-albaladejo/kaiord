/**
 * Theme utility functions
 */

export type Theme = "light" | "dark" | "kiroween" | "system";
export type ResolvedTheme = "light" | "dark" | "kiroween";

/**
 * Local storage key for theme preference
 */
const THEME_STORAGE_KEY = "workout-editor-theme";

/**
 * Get system theme preference
 */
export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Get stored theme preference from localStorage
 */
export const getStoredTheme = (): Theme | null => {
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
    // Silently fail - theme preference is not critical
    // In production, consider logging to error tracking service
    // Only log in development/test for debugging
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to read theme from localStorage:", error);
    }
  }

  return null;
};

/**
 * Store theme preference in localStorage
 */
export const storeTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Silently fail - theme preference is not critical
    // In production, consider logging to error tracking service
    // Only log in development/test for debugging
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to store theme in localStorage:", error);
    }
  }
};

/**
 * Resolve theme to actual light/dark value
 */
export const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};

/**
 * Apply theme to document
 */
export const applyTheme = (resolvedTheme: ResolvedTheme): void => {
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
