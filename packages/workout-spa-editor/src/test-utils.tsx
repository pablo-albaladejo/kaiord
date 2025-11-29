import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { ToastProvider } from "./components/atoms/Toast";
import { ThemeProvider, type Theme } from "./contexts/ThemeContext";
import { ToastContextProvider } from "./contexts/ToastContext";

/**
 * Options for renderWithProviders
 */
export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  defaultTheme?: Theme;
};

/**
 * Custom render function that wraps components with necessary providers
 * Includes ThemeProvider for components that use theme context
 * Includes ToastContextProvider for components that use toast notifications
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions
) {
  const { defaultTheme, ...renderOptions } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider defaultTheme={defaultTheme}>
        <ToastProvider>
          <ToastContextProvider>{children}</ToastContextProvider>
        </ToastProvider>
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
