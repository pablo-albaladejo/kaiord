import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";

/**
 * Custom render function that wraps components with necessary providers
 * Includes ThemeProvider for components that use theme context
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <ThemeProvider>{children}</ThemeProvider>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
