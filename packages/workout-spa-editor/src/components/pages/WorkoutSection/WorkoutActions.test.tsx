import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { WorkoutActions } from "./WorkoutActions";

describe("WorkoutActions", () => {
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

  const defaultProps = { krd: mockKRD, onDiscard: vi.fn() };

  describe("the three verbs", () => {
    it("should offer keeping and downloading, and nothing that sends", () => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const labels = screen
        .getAllByRole("button")
        .map((b) => b.textContent ?? "");

      // Assert
      expect(labels.some((l) => l.includes("Keep in library"))).toBe(true);
      expect(labels.some((l) => l.includes("Download a file"))).toBe(true);
      expect(labels.some((l) => l.includes("Garmin"))).toBe(false);
    });

    it("should keep the send path out of this row entirely", () => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const sendButton = screen.queryByTestId("send-to-garmin-button");

      // Assert
      expect(sendButton).toBeNull();
    });

    it("should render keep before download", () => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const buttons = screen.getAllByRole("button");
      const keepIndex = buttons.findIndex((b) =>
        b.textContent?.includes("Keep in library")
      );
      const downloadIndex = buttons.findIndex((b) =>
        b.textContent?.includes("Download a file")
      );

      // Assert
      expect(keepIndex).toBeLessThan(downloadIndex);
    });

    it("should render discard last", () => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const buttons = screen.getAllByRole("button");

      // Assert
      expect(buttons[buttons.length - 1]?.textContent).toContain("Discard");
    });
  });

  describe("layout", () => {
    it.each([
      { className: "flex" },
      { className: "flex-wrap" },
      { className: "gap-2.5" },
    ])("should apply $className to the action row", ({ className }) => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const container = screen.getByTestId(
        "discard-workout-button"
      ).parentElement;

      // Assert
      expect(container).toHaveClass(className);
    });

    it("should paint discard from the role layer rather than a raw red", () => {
      // Arrange
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Act
      const discardButton = screen.getByTestId("discard-workout-button");

      // Assert
      expect(discardButton.className).toContain("text-ink-muted");
      expect(discardButton.className).not.toContain("text-red-");
    });
  });

  describe("interactions", () => {
    it("should call onDiscard when the discard button is clicked", async () => {
      // Arrange
      const handleDiscard = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <WorkoutActions {...defaultProps} onDiscard={handleDiscard} />
      );
      const discardButton = screen.getByTestId("discard-workout-button");

      // Act
      await user.click(discardButton);

      // Assert
      expect(handleDiscard).toHaveBeenCalledOnce();
    });
  });
});
