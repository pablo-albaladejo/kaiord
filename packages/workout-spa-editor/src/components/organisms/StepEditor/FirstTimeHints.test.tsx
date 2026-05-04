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
      // Arrange

      // Act

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Assert

      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();
      expect(screen.getByText("Set Duration")).toBeInTheDocument();
    });

    it("should not render hints if already completed", () => {
      // Arrange
      // Arrange

      localStorage.setItem(TEST_STORAGE_KEY, "true");

      // Act

      // Act

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Assert

      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
    });

    it("should render with default storage key", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<FirstTimeHints />);

      // Assert

      // Assert

      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();
    });

    it("should render progress dots", () => {
      // Arrange & Act
      // Arrange

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Act

      const dots = screen.getAllByLabelText(/Hint \d+ of 3/);

      // Assert

      expect(dots).toHaveLength(3);
    });

    it("should highlight current hint dot", () => {
      // Arrange & Act
      // Arrange

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Act

      const currentDot = screen.getByLabelText("Hint 1 of 3 (current)");

      // Assert

      expect(currentDot).toHaveClass("bg-primary-600");
    });
  });

  describe("interactions", () => {
    it("should dismiss hints when close button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <FirstTimeHints storageKey={TEST_STORAGE_KEY} onDismiss={onDismiss} />
      );

      // Act

      // Act

      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert

      // Assert

      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("should save completion state when dismissed", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Act

      // Act

      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert

      // Assert

      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBe("true");
    });

    it("should display first hint initially", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert - first hint is shown

      // Assert

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
      // Arrange

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Act

      const hints = screen.getByTestId("first-time-hints");

      // Assert

      expect(hints).toHaveAttribute("role", "status");
      expect(hints).toHaveAttribute("aria-live", "polite");
    });

    it("should have accessible close button", () => {
      // Arrange & Act
      // Arrange

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Act

      const closeButton = screen.getByLabelText("Dismiss hints");

      // Assert

      expect(closeButton).toBeInTheDocument();
    });

    it("should have accessible progress dots", () => {
      // Arrange & Act
      // Arrange

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert

      // Act

      const dots = screen.getAllByLabelText(/Hint \d+ of 3/);

      // Assert

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
        // Arrange

        // Act

        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert

        // Assert

        expect(result).toBe(false);
      });

      it("should return true if completion state is saved", () => {
        // Arrange
        // Arrange

        localStorage.setItem(TEST_STORAGE_KEY, "true");

        // Act

        // Act

        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert

        // Assert

        expect(result).toBe(true);
      });

      it("should return false if localStorage throws error", () => {
        // Arrange
        // Arrange

        const getItemSpy = vi
          .spyOn(Storage.prototype, "getItem")
          .mockImplementation(() => {
            throw new Error("Storage error");
          });

        // Act

        // Act

        const result = hasCompletedFirstWorkout(TEST_STORAGE_KEY);

        // Assert

        // Assert

        expect(result).toBe(false);

        getItemSpy.mockRestore();
      });

      it("should use default storage key when not provided", () => {
        // Arrange
        // Arrange

        const defaultKey = "workout-spa-first-workout-hints-dismissed";
        localStorage.setItem(defaultKey, "true");

        // Act

        // Act

        const result = hasCompletedFirstWorkout();

        // Assert

        // Assert

        expect(result).toBe(true);
      });
    });

    describe("resetFirstWorkoutState", () => {
      it("should remove completion state from localStorage", () => {
        // Arrange
        // Arrange

        localStorage.setItem(TEST_STORAGE_KEY, "true");

        // Act

        // Act

        resetFirstWorkoutState(TEST_STORAGE_KEY);

        // Assert

        // Assert

        expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
      });

      it("should handle localStorage errors gracefully", () => {
        // Arrange
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

        // Act

        resetFirstWorkoutState(TEST_STORAGE_KEY);

        // Assert

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
        // Arrange

        const defaultKey = "workout-spa-first-workout-hints-dismissed";
        localStorage.setItem(defaultKey, "true");

        // Act

        // Act

        resetFirstWorkoutState();

        // Assert

        // Assert

        expect(localStorage.getItem(defaultKey)).toBeNull();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle missing localStorage gracefully", () => {
      // Arrange
      // Arrange

      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("localStorage not available");
        });

      // Act

      // Act

      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Assert - should render hints (default to first-time user)

      // Assert

      expect(screen.getByTestId("first-time-hints")).toBeInTheDocument();

      getItemSpy.mockRestore();
    });

    it("should handle setItem errors when dismissing", async () => {
      // Arrange
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

      // Act

      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert - hints should still be dismissed from UI

      // Assert

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
      // Arrange

      const user = userEvent.setup();
      render(<FirstTimeHints storageKey={TEST_STORAGE_KEY} />);

      // Act & Assert - should not throw

      // Act

      await user.click(screen.getByLabelText("Dismiss hints"));

      // Assert

      expect(screen.queryByTestId("first-time-hints")).not.toBeInTheDocument();
    });
  });
});
