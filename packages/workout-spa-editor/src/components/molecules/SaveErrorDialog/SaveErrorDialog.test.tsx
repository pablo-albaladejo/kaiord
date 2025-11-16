/**
 * SaveErrorDialog Component Tests
 *
 * Tests for the SaveErrorDialog component that displays validation errors
 * when saving a workout fails.
 *
 * Requirements:
 * - Requirement 6.3: Display specific validation errors with field references
 * - Requirement 36: Clear error feedback with retry options
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ValidationError } from "../../../types/krd";
import { SaveErrorDialog } from "./SaveErrorDialog";

describe("SaveErrorDialog", () => {
  describe("rendering", () => {
    it("should render dialog with title and icon", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout", "name"], message: "Name is required" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText("Save Failed")).toBeInTheDocument();
      expect(
        screen.getByText(/The workout could not be saved/)
      ).toBeInTheDocument();
    });

    it("should render all validation errors", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout", "name"], message: "Name is required" },
        { path: ["workout", "sport"], message: "Sport is required" },
        { path: ["steps", "0", "duration"], message: "Duration is invalid" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/workout\.name:/)).toBeInTheDocument();
      expect(screen.getByText(/Name is required/)).toBeInTheDocument();
      expect(screen.getByText(/workout\.sport:/)).toBeInTheDocument();
      expect(screen.getByText(/Sport is required/)).toBeInTheDocument();
      expect(screen.getByText(/steps\.0\.duration:/)).toBeInTheDocument();
      expect(screen.getByText(/Duration is invalid/)).toBeInTheDocument();
    });

    it("should render error without path prefix when path is empty", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: [], message: "General validation error" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText("General validation error")).toBeInTheDocument();
      // Verify no path prefix is shown (no font-medium span with path)
      const errorContainer = screen.getByText(
        "General validation error"
      ).parentElement;
      expect(
        errorContainer?.querySelector(".font-medium")
      ).not.toBeInTheDocument();
    });

    it("should render all action buttons", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3); // Header close (X), footer Close, Fix and Retry
      expect(
        screen.getByRole("button", { name: "Fix and Retry" })
      ).toBeInTheDocument();
    });

    it("should render close button in header with aria-label", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      expect(closeButtons).toHaveLength(2); // One with aria-label, one with text
      expect(closeButtons[0]).toHaveAttribute("aria-label", "Close");
    });
  });

  describe("interactions", () => {
    it("should call onClose when footer Close button is clicked", async () => {
      // Arrange
      const handleClose = vi.fn();
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];
      const user = userEvent.setup();
      render(
        <SaveErrorDialog
          errors={errors}
          onClose={handleClose}
          onRetry={vi.fn()}
        />
      );

      // Act
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      await user.click(closeButtons[1]); // Footer button (second one)

      // Assert
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it("should call onClose when header close button is clicked", async () => {
      // Arrange
      const handleClose = vi.fn();
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];
      const user = userEvent.setup();
      render(
        <SaveErrorDialog
          errors={errors}
          onClose={handleClose}
          onRetry={vi.fn()}
        />
      );

      // Act
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      await user.click(closeButtons[0]); // Header button (first one)

      // Assert
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it("should call onRetry when Fix and Retry button is clicked", async () => {
      // Arrange
      const handleRetry = vi.fn();
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];
      const user = userEvent.setup();
      render(
        <SaveErrorDialog
          errors={errors}
          onClose={vi.fn()}
          onRetry={handleRetry}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: "Fix and Retry" }));

      // Assert
      expect(handleRetry).toHaveBeenCalledOnce();
    });
  });

  describe("edge cases", () => {
    it("should handle single error", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout", "name"], message: "Name is required" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/workout\.name:/)).toBeInTheDocument();
      expect(screen.getByText(/Name is required/)).toBeInTheDocument();
    });

    it("should handle many errors with scrollable list", () => {
      // Arrange
      const errors: Array<ValidationError> = Array.from(
        { length: 10 },
        (_, i) => ({
          path: ["steps", String(i)],
          message: `Error ${i + 1}`,
        })
      );

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      errors.forEach((error, i) => {
        expect(screen.getByText(`Error ${i + 1}`)).toBeInTheDocument();
      });
    });

    it("should handle deeply nested error paths", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        {
          path: ["workout", "steps", "0", "target", "value", "min"],
          message: "Minimum value is required",
        },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByText(/workout\.steps\.0\.target\.value\.min:/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Minimum value is required/)).toBeInTheDocument();
    });

    it("should handle error with special characters in message", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        {
          path: ["workout"],
          message: 'Value must be between 1-100 (got "invalid")',
        },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByText(/Value must be between 1-100 \(got "invalid"\)/)
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have accessible close button with aria-label", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      expect(closeButtons[0]).toHaveAttribute("aria-label", "Close");
    });

    it("should have semantic button elements", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["workout"], message: "Invalid workout" },
      ];

      // Act
      render(
        <SaveErrorDialog errors={errors} onClose={vi.fn()} onRetry={vi.fn()} />
      );

      // Assert
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3); // Header close, Close, Fix and Retry
    });
  });
});
