/**
 * DeleteConfirmDialog Component Tests
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

describe("DeleteConfirmDialog", () => {
  describe("rendering", () => {
    it("should render with step index", () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <DeleteConfirmDialog
          stepIndex={2}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Assert
      expect(
        screen.getByRole("heading", { name: /delete step/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to delete step 3/i)
      ).toBeInTheDocument();
    });

    it("should render confirm and cancel buttons", () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <DeleteConfirmDialog
          stepIndex={0}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete step/i })
      ).toBeInTheDocument();
    });

    it("should render close button", () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <DeleteConfirmDialog
          stepIndex={0}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /close/i })
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onConfirm when delete button is clicked", async () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <DeleteConfirmDialog
          stepIndex={1}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /delete step/i }));

      // Assert
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should call onCancel when cancel button is clicked", async () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <DeleteConfirmDialog
          stepIndex={1}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("should call onCancel when close button is clicked", async () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <DeleteConfirmDialog
          stepIndex={1}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /close/i }));

      // Assert
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
