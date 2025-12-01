/**
 * FirstTimeHints Component Tests
 *
 * Tests for inline hints shown to first-time users during workout creation.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FirstTimeHints,
  hasCompletedFirstWorkout,
  resetFirstWorkoutState,
} from "./FirstTimeHints";

describe("FirstTimeHints", () => {
  const TEST_STORAGE_KEY = "test-first-workout-hints";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("should render hints for first-time users", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();
      expect(screen.getByText("Set Duration")).toBeInTheDocument();
    });

    it("should not render hints if already completed", () => {
      // Arrange
      localStorage.setItem(TEST_STORAGE_KEY, "true");

      // Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
    });

    it("should render with default storage key", () => {
      // Arrange & Act
      render(<FirstTimeHints />);

      // Assert
      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();
    });

    it("should render progress dots", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      const dots = screen.getAllByLabelText(/Hint \d+ of 3/);
      expect(dots).toHaveLength(3);
    });

    it("should highlight current hint dot", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      const currentDot = screen.getByLabelText("Hint 1 of 3 (current)");
      expect(currentDot).toHaveClass("bg-primary-600");
    });
  });

  describe("interactions", () => {
    it("should dismiss hints when close button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <FirstTimeHints storageKey={TEST_STORAGE_KEY} onDismiss={onDismiss} />
      );

      // Act
      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert
      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("should save completion state when dismissed", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Act
      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert
      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBe("true");
    });

    it("should display first hint initially", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert - first hint is shown
      expect(screen.getByText("Set Duration")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Choose how long this step should last - by time, distance, or open-ended/
        )
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      const hints = screen.getByTestId("first-time-hints");
      expect(hints).toHaveAttribute("role", "status");
      expect(hints).toHaveAttribute("aria-live", "polite");
    });

    it("should have accessible close button", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      const closeButton = screen.getByLabelText("Dismiss hints");
      expect(closeButton).toBeInTheDocument();
    });

    it("should have accessible progress dots", () => {
      // Arrange & Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert
      const dots = screen.getAllByLabelText(/Hint \d+ of 3/);
      expect(dots).toHaveLength(3);
      expect(dots[0]).toHaveAttribute("aria-label", "Hint 1 of 3 (current)");
      expect(dots[1]).toHaveAttribute("aria-label", "Hint 2 of 3");
      expect(dots[2]).toHaveAttribute("aria-label", "Hint 3 of 3");
    });
  });

  describe("utility functions", () => {
    describe("hasCompletedFirstWorkout", () => {
      it("should return false for first-time users", () => {
        // Arrange & Act
        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert
        expect(result).toBe(false);
      });

      it("should return true if completion state is saved", () => {
        // Arrange
        localStorage.setItem(TEST_STORAGE_KEY, "true");

        // Act
        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert
        expect(result).toBe(true);
      });

      it("should return false if localStorage throws error", () => {
        // Arrange
        const getItemSpy = vi
          .spyOn(Storage.prototype, "getItem")
          .mockImplementation(() => {
            throw new Error("Storage error");
          });

        // Act
        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert
        expect(result).toBe(false);

        getItemSpy.mockRestore();
      });

      it("should use default storage key when not provided", () => {
        // Arrange
        const defaultKey = "workout-spa-first-workout-hints-dismissed";
        localStorage.setItem(defaultKey, "true");

        // Act
        const result = hasCompletedFirstWorkout();

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("resetFirstWorkoutState", () => {
      it("should remove completion state from localStorage", () => {
        // Arrange
        localStorage.setItem(TEST_STORAGE_KEY, "true");

        // Act
        resetFirstWorkoutState(TEST_STORAGE_KEY);

        // Assert
        expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
      });

      it("should handle localStorage errors gracefully", () => {
        // Arrange
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const removeItemSpy = vi
          .spyOn(Storage.prototype, "removeItem")
          .mockImplementation(() => {
            throw new Error("Storage error");
          });

        // Act
        resetFirstWorkoutState(TEST_STORAGE_KEY);

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to reset first workout state:",
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
        removeItemSpy.mockRestore();
      });

      it("should use default storage key when not provided", () => {
        // Arrange
        const defaultKey = "workout-spa-first-workout-hints-dismissed";
        localStorage.setItem(defaultKey, "true");

        // Act
        resetFirstWorkoutState();

        // Assert
        expect(localStorage.getItem(defaultKey)).toBeNull();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle missing localStorage gracefully", () => {
      // Arrange
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("localStorage not available");
        });

      // Act
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert - should render hints (default to first-time user)
      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();

      getItemSpy.mockRestore();
    });

    it("should handle setItem errors when dismissing", async () => {
      // Arrange
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Act
      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert - hints should still be dismissed from UI
      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save first workout completion state:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it("should not call onDismiss if not provided", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Act & Assert - should not throw
      await user.click(screen.getByLabelText("Dismiss hints"));
      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
    });
  });
});
