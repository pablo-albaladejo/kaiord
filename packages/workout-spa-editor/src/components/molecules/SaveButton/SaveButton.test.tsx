import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../types/krd";
import * as saveWorkoutModule from "../../../utils/save-workout";
import { SaveButton } from "./SaveButton";

// Mock the save-workout utility
vi.mock("../../../utils/save-workout", () => ({
  saveWorkout: vi.fn(),
}));

describe("SaveButton", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render save button with default text", () => {
      // Arrange & Act
      render(<SaveButton workout={mockKRD} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /save workout/i })
      ).toBeInTheDocument();
    });

    it("should render download icon", () => {
      // Arrange & Act
      render(<SaveButton workout={mockKRD} />);

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      // Arrange & Act
      render(<SaveButton workout={mockKRD} className="custom-class" />);

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("save functionality", () => {
    it("should call saveWorkout when button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(saveWorkoutModule.saveWorkout).mockReturnValue({
        success: true,
      });

      // Act
      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      // Assert
      expect(saveWorkoutModule.saveWorkout).toHaveBeenCalledWith(mockKRD);
    });

    it("should not call saveWorkout when disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<SaveButton workout={mockKRD} disabled={true} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      // Assert
      expect(saveWorkoutModule.saveWorkout).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should display error dialog when save fails", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockErrors = [
        { path: ["version"], message: "Invalid version" },
        { path: ["type"], message: "Invalid type" },
      ];

      vi.mocked(saveWorkoutModule.saveWorkout).mockReturnValue({
        success: false,
        errors: mockErrors,
      });

      // Act
      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Save Failed")).toBeInTheDocument();
        expect(screen.getByText(/could not be saved/)).toBeInTheDocument();
      });
    });

    it("should display validation errors in error dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockErrors = [
        { path: ["metadata", "sport"], message: "Sport is required" },
        {
          path: ["extensions", "workout", "steps"],
          message: "At least one step required",
        },
      ];

      vi.mocked(saveWorkoutModule.saveWorkout).mockReturnValue({
        success: false,
        errors: mockErrors,
      });

      // Act
      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/metadata\.sport/)).toBeInTheDocument();
        expect(screen.getByText(/Sport is required/)).toBeInTheDocument();
      });
    });

    it("should close error dialog when close button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockErrors = [{ path: ["version"], message: "Invalid version" }];

      vi.mocked(saveWorkoutModule.saveWorkout).mockReturnValue({
        success: false,
        errors: mockErrors,
      });

      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Save Failed")).toBeInTheDocument();
      });

      // Act - Close the dialog
      const closeButtons = screen.getAllByRole("button", { name: /^close$/i });
      await user.click(closeButtons[closeButtons.length - 1]);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("Save Failed")).not.toBeInTheDocument();
      });
    });

    it("should allow retry after error", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockErrors = [{ path: ["version"], message: "Invalid version" }];

      vi.mocked(saveWorkoutModule.saveWorkout)
        .mockReturnValueOnce({
          success: false,
          errors: mockErrors,
        })
        .mockReturnValueOnce({
          success: true,
        });

      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Save Failed")).toBeInTheDocument();
      });

      // Act - Click retry button (which closes dialog)
      const retryButton = screen.getByRole("button", {
        name: /fix and retry/i,
      });
      await user.click(retryButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText("Save Failed")).not.toBeInTheDocument();
      });

      // Click save button again
      await user.click(button);

      // Assert - Second save should succeed
      expect(saveWorkoutModule.saveWorkout).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled state", () => {
    it("should be disabled when disabled prop is true", () => {
      // Arrange & Act
      render(<SaveButton workout={mockKRD} disabled={true} />);

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });
      expect(button).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("should have proper button role", () => {
      // Arrange & Act
      render(<SaveButton workout={mockKRD} />);

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });
      expect(button).toBeInTheDocument();
    });

    it("should be keyboard accessible", async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(saveWorkoutModule.saveWorkout).mockReturnValue({
        success: true,
      });

      // Act
      render(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      button.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(saveWorkoutModule.saveWorkout).toHaveBeenCalled();
    });
  });
});
