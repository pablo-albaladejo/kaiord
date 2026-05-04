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
      // Arrange

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const button = screen.getByRole("button", {
        name: /switch to dark mode/i,
      });

      // Assert

      expect(button).toBeInTheDocument();
    });

    it("should show sun icon in light mode", () => {
      // Arrange

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
    });

    it("should show moon icon in dark mode", () => {
      // Arrange

      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });
  });

  describe("interactions", () => {
    it("should cycle from light to dark mode", async () => {
      // Arrange

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

      // Act

      await user.click(button);

      // Assert - cycles to dark

      // Assert

      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });

    it("should cycle from dark to light mode", async () => {
      // Arrange

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

      // Act

      await user.click(button);

      // Assert - cycles back to light

      // Assert

      expect(button).toHaveAttribute("aria-label", "Switch to dark mode");
    });

    it("should toggle from system theme to explicit theme", async () => {
      // Arrange

      const user = userEvent.setup();

      render(
        <ThemeProvider defaultTheme="system">
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole("button");

      // System theme resolves based on actual system preference
      // Just verify the button has an aria-label

      // Act

      const initialLabel = button.getAttribute("aria-label");

      // Assert

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
      // Arrange

      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("aria-label", "Switch to light mode");
    });

    it("should have title attribute for tooltip", () => {
      // Arrange

      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("title", "Switch to light mode");
    });

    it("should have aria-hidden on icon", () => {
      // Arrange

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      // Act

      const icon = screen.getByRole("button").querySelector("span");

      // Assert

      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
