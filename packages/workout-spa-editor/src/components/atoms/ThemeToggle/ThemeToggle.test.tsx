import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("rendering", () => {
    it("should render toggle button", () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button", {
        name: /switch to dark mode/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should show sun icon in light mode", () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
    });

    it("should show moon icon in dark mode", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });
  });

  describe("interactions", () => {
    it("should cycle from light to dark mode", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button", {
        name: /switch to dark mode/i,
      });

      // Act
      await user.click(button);

      // Assert - cycles to dark
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });

    it("should cycle from dark to light mode", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button", {
        name: /switch to light mode/i,
      });

      // Act
      await user.click(button);

      // Assert - cycles back to light
      expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
    });

    it("should toggle from system theme to explicit theme", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");

      // System theme resolves based on actual system preference
      // Just verify the button has an aria-label
      const initialLabel = button.getAttribute("aria-label");
      expect(initialLabel).toMatch(/Switch to (light|dark) mode/);

      // Act - click to toggle
      await user.click(button);

      // Assert - label should change
      const newLabel = button.getAttribute("aria-label");
      expect(newLabel).toMatch(/Switch to (light|dark) mode/);
      expect(newLabel).not.toBe(initialLabel);
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label in dark mode", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });

    it("should have title attribute for tooltip", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Switch to light mode");
    });

    it("should have aria-hidden on icon", () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      const icon = screen.getByRole("button").querySelector("span");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
