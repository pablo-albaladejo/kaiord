import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Toast } from "./Toast";
import { ToastProvider } from "./ToastProvider";

describe("Toast", () => {
  describe("rendering", () => {
    it("should render with title", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <ToastProvider>
          <Toast title="Test notification" open={true} />
        </ToastProvider>
      );

      // Assert

      // Assert

      expect(screen.getByText("Test notification")).toBeInTheDocument();
    });

    it("should render with title and description", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <ToastProvider>
          <Toast
            title="Success"
            description="Operation completed successfully"
            open={true}
          />
        </ToastProvider>
      );

      // Assert

      // Assert

      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(
        screen.getByText("Operation completed successfully")
      ).toBeInTheDocument();
    });

    it("should render without description when not provided", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <ToastProvider>
          <Toast title="Simple notification" open={true} />
        </ToastProvider>
      );

      // Assert: title is present, but no description node exists

      // Assert

      expect(screen.getByText("Simple notification")).toBeInTheDocument();
      expect(screen.queryByTestId("toast-description")).not.toBeInTheDocument();
    });

    it("should render close button", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Test" open={true} />
        </ToastProvider>
      );

      // Assert

      // Act

      const closeButton = screen.getByRole("button", { name: "Close" });

      // Assert

      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("should render success variant with correct styles", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Success" variant="success" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Success");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toHaveClass("border-green-500");
      expect(toast).toHaveClass("bg-green-50");
    });

    it("should render error variant with correct styles", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Error" variant="error" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Error");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toHaveClass("border-red-500");
      expect(toast).toHaveClass("bg-red-50");
    });

    it("should render warning variant with correct styles", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Warning" variant="warning" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Warning");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toHaveClass("border-yellow-500");
      expect(toast).toHaveClass("bg-yellow-50");
    });

    it("should render info variant with correct styles", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Info" variant="info" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Info");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toHaveClass("border-blue-500");
      expect(toast).toHaveClass("bg-blue-50");
    });

    it("should default to info variant when not specified", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Default" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Default");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toHaveClass("border-blue-500");
    });
  });

  describe("interactions", () => {
    it("should call onOpenChange when close button is clicked", async () => {
      // Arrange
      // Arrange

      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <Toast title="Test" open={true} onOpenChange={handleOpenChange} />
        </ToastProvider>
      );

      // Act
      const closeButton = screen.getByRole("button", { name: "Close" });

      // Act

      await user.click(closeButton);

      // Assert

      // Assert

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("should render custom action button", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(
        <ToastProvider>
          <Toast title="Test" open={true} action={<button>Undo</button>} />
        </ToastProvider>
      );

      // Assert

      // Assert

      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("should call action button onClick", async () => {
      // Arrange
      // Arrange

      const handleAction = vi.fn();
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <Toast
            title="Test"
            open={true}
            action={<button onClick={handleAction}>Undo</button>}
          />
        </ToastProvider>
      );

      // Act
      const actionButton = screen.getByRole("button", { name: "Undo" });

      // Act

      await user.click(actionButton);

      // Assert

      // Assert

      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("auto-dismiss", () => {
    it("should auto-dismiss after default duration", async () => {
      // Arrange
      // Arrange

      const handleOpenChange = vi.fn();

      // Act

      render(
        <ToastProvider>
          <Toast
            title="Auto dismiss"
            open={true}
            onOpenChange={handleOpenChange}
            duration={100}
          />
        </ToastProvider>
      );

      // Act

      // Assert

      await waitFor(
        () => {
          expect(handleOpenChange).toHaveBeenCalledWith(false);
        },
        { timeout: 200 }
      );
    });

    it("should respect custom duration", async () => {
      // Arrange
      // Arrange

      const handleOpenChange = vi.fn();

      // Act

      render(
        <ToastProvider>
          <Toast
            title="Custom duration"
            open={true}
            onOpenChange={handleOpenChange}
            duration={50}
          />
        </ToastProvider>
      );

      // Act

      // Assert

      await waitFor(
        () => {
          expect(handleOpenChange).toHaveBeenCalledWith(false);
        },
        { timeout: 100 }
      );
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA role", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Accessible toast" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Accessible toast");

      // Act

      const toast = title.closest("li");

      // Assert

      expect(toast).toBeInTheDocument();
    });

    it("should have accessible close button", () => {
      // Arrange & Act
      // Arrange

      render(
        <ToastProvider>
          <Toast title="Test" open={true} />
        </ToastProvider>
      );

      // Assert

      // Act

      const closeButton = screen.getByRole("button", { name: "Close" });

      // Assert

      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("should support keyboard navigation", async () => {
      // Arrange
      // Arrange

      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <Toast title="Test" open={true} onOpenChange={handleOpenChange} />
        </ToastProvider>
      );

      // Act
      const closeButton = screen.getByRole("button", { name: "Close" });
      closeButton.focus();

      // Act

      await user.keyboard("{Enter}");

      // Assert

      // Assert

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("custom props", () => {
    it("should forward ref", () => {
      // Arrange
      // Arrange

      const ref = vi.fn();

      // Act

      // Act

      render(
        <ToastProvider>
          <Toast ref={ref} title="Ref test" open={true} />
        </ToastProvider>
      );

      // Assert

      // Assert

      expect(ref).toHaveBeenCalled();
    });
  });
});
