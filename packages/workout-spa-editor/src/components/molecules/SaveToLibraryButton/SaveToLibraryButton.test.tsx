/**
 * SaveToLibraryButton Component Tests
 *
 * Tests for the SaveToLibraryButton component.
 */

import { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import { SaveToLibraryButton } from "./SaveToLibraryButton";

describe("SaveToLibraryButton", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  describe("rendering", () => {
    it("should render button with correct text", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderWithProviders(<SaveToLibraryButton workout={workout} />);

      // Assert
      const button = screen.getByRole("button", { name: /save to library/i });
      expect(button).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderWithProviders(
        <SaveToLibraryButton workout={workout} className="custom-class" />
      );

      // Assert
      const button = screen.getByRole("button", { name: /save to library/i });
      expect(button).toHaveClass("custom-class");
    });

    it("should render icon", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderWithProviders(<SaveToLibraryButton workout={workout} />);

      // Assert
      const button = screen.getByRole("button", { name: /save to library/i });
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should open dialog when clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      renderWithProviders(<SaveToLibraryButton workout={workout} />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /save to library/i })
      );

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getAllByText("Save to Library").length).toBeGreaterThan(0);
    });

    it("should not open dialog when disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      renderWithProviders(<SaveToLibraryButton workout={workout} disabled />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /save to library/i })
      );

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("states", () => {
    it("should be disabled when disabled prop is true", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderWithProviders(<SaveToLibraryButton workout={workout} disabled />);

      // Assert
      const button = screen.getByRole("button", { name: /save to library/i });
      expect(button).toBeDisabled();
    });

    it("should be enabled by default", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderWithProviders(<SaveToLibraryButton workout={workout} />);

      // Assert
      const button = screen.getByRole("button", { name: /save to library/i });
      expect(button).toBeEnabled();
    });
  });
});
