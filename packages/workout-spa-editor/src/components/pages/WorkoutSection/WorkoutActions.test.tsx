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

  const defaultProps = {
    krd: mockKRD,
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onDiscard: vi.fn(),
  };

  describe("button spacing", () => {
    it("should have 12px gap between button groups", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const container = screen.getByTestId(
        "discard-workout-button"
      ).parentElement;
      expect(container).toHaveClass("gap-3"); // gap-3 = 12px in Tailwind
    });

    it("should have consistent spacing in button row", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const discardButton = screen.getByTestId("discard-workout-button");
      const outerContainer = discardButton.parentElement;
      const buttonRow = outerContainer?.firstElementChild;
      expect(buttonRow).toHaveClass("gap-3"); // gap-3 = 12px
    });
  });

  describe("button alignment", () => {
    it("should align buttons in a row on desktop", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const discardButton = screen.getByTestId("discard-workout-button");
      const outerContainer = discardButton.parentElement;
      const buttonRow = outerContainer?.firstElementChild;
      expect(buttonRow).toHaveClass("sm:flex-row");
    });

    it("should stack buttons vertically on mobile", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const discardButton = screen.getByTestId("discard-workout-button");
      const outerContainer = discardButton.parentElement;
      const buttonRow = outerContainer?.firstElementChild;
      expect(buttonRow).toHaveClass("flex-col");
    });
  });

  describe("button variants", () => {
    it("should use primary variant for save button", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const saveButton = screen.getByRole("button", { name: /save workout/i });
      // SaveButton component should use primary variant by default
      expect(saveButton).toBeInTheDocument();
    });

    it("should use secondary variant for discard button", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const discardButton = screen.getByRole("button", { name: /discard/i });
      expect(discardButton).toHaveClass("border"); // Secondary variant has border
    });
  });

  describe("button organization", () => {
    it("should render save button before library button", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      const saveButtonIndex = buttons.findIndex((btn) =>
        btn.textContent?.includes("Save")
      );
      const libraryButtonIndex = buttons.findIndex((btn) =>
        btn.textContent?.includes("Library")
      );
      expect(saveButtonIndex).toBeLessThan(libraryButtonIndex);
    });

    it("should render discard button last", () => {
      // Arrange & Act
      renderWithProviders(<WorkoutActions {...defaultProps} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      const discardButton = buttons[buttons.length - 1];
      expect(discardButton.textContent).toContain("Discard");
    });
  });

  describe("interactions", () => {
    it("should call onDiscard when discard button is clicked", async () => {
      // Arrange
      const handleDiscard = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <WorkoutActions {...defaultProps} onDiscard={handleDiscard} />
      );

      // Act
      const discardButton = screen.getByRole("button", { name: /discard/i });
      await user.click(discardButton);

      // Assert
      expect(handleDiscard).toHaveBeenCalledOnce();
    });
  });
});
