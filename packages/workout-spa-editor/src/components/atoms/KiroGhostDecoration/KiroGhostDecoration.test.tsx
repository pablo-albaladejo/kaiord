import { ThemeProvider } from "@/contexts/ThemeContext";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KiroGhostDecoration } from "./KiroGhostDecoration";

describe("KiroGhostDecoration", () => {
  describe("rendering", () => {
    it("should not render when theme is light", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="light">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should not render when theme is dark", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="dark">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should render ghost decorations when theme is kiroween", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="kiroween">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      const decorationContainer = container.querySelector(
        '[aria-hidden="true"]'
      );
      expect(decorationContainer).toBeInTheDocument();
      expect(decorationContainer).toHaveClass("pointer-events-none");
      expect(decorationContainer).toHaveClass("fixed");
      expect(decorationContainer).toHaveClass("inset-0");
    });

    it("should have aria-hidden attribute", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="kiroween">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      const decorationContainer = container.querySelector(
        '[aria-hidden="true"]'
      );
      expect(decorationContainer).toHaveAttribute("aria-hidden", "true");
    });

    it("should render multiple ghost SVGs", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="kiroween">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("should have floating animation classes", () => {
      // Arrange & Act
      const { container } = render(
        <ThemeProvider defaultTheme="kiroween">
          <KiroGhostDecoration />
        </ThemeProvider>
      );

      // Assert
      const floatingElements = container.querySelectorAll(".animate-float");
      const delayedElements = container.querySelectorAll(
        ".animate-float-delayed"
      );

      expect(floatingElements.length).toBeGreaterThan(0);
      expect(delayedElements.length).toBeGreaterThan(0);
    });
  });
});
