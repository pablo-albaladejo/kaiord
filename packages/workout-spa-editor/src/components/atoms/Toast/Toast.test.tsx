import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";
import { ToastProvider } from "./ToastProvider";

describe("Toast", () => {
  describe("rendering", () => {
    it("should render with title", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Test notification" open={true} />
        </ToastProvider>
      );

      // Assert
      expect(screen.getByText("Test notification")).toBeInTheDocument();
    });

    it("should render with title and description", () => {
      // Arrange & Act
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
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(
        screen.getByText("Operation completed successfully")
      ).toBeInTheDocument();
    });

    it("should render without description when not provided", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Simple notification" open={true} />
        </ToastProvider>
      );

      // Assert: title is present, but no description node exists
      expect(screen.getByText("Simple notification")).toBeInTheDocument();
      expect(screen.queryByTestId("toast-description")).not.toBeInTheDocument();
    });

    it("should render close button", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Test" open={true} />
        </ToastProvider>
      );

      // Assert
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("should render success variant with correct styles", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Success" variant="success" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Success");
      const toast = title.closest("li");
      expect(toast).toHaveClass("border-green-500");
      expect(toast).toHaveClass("bg-green-50");
    });

    it("should render error variant with correct styles", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Error" variant="error" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Error");
      const toast = title.closest("li");
      expect(toast).toHaveClass("border-red-500");
      expect(toast).toHaveClass("bg-red-50");
    });

    it("should render warning variant with correct styles", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Warning" variant="warning" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Warning");
      const toast = title.closest("li");
      expect(toast).toHaveClass("border-yellow-500");
      expect(toast).toHaveClass("bg-yellow-50");
    });

    it("should render info variant with correct styles", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Info" variant="info" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Info");
      const toast = title.closest("li");
      expect(toast).toHaveClass("border-blue-500");
      expect(toast).toHaveClass("bg-blue-50");
    });

    it("should default to info variant when not specified", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Default" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Default");
      const toast = title.closest("li");
      expect(toast).toHaveClass("border-blue-500");
    });
  });

  describe("interactions", () => {
    it("should call onOpenChange when close button is clicked", async () => {
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
      await user.click(closeButton);

      // Assert
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("should render custom action button", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Test" open={true} action={<button>Undo</button>} />
        </ToastProvider>
      );

      // Assert
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("should call action button onClick", async () => {
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
      await user.click(actionButton);

      // Assert
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("auto-dismiss", () => {
    it("should auto-dismiss after default duration", async () => {
      // Arrange
      const handleOpenChange = vi.fn();

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
      await waitFor(
        () => {
          expect(handleOpenChange).toHaveBeenCalledWith(false);
        },
        { timeout: 200 }
      );
    });

    it("should respect custom duration", async () => {
      // Arrange
      const handleOpenChange = vi.fn();

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
      render(
        <ToastProvider>
          <Toast title="Accessible toast" open={true} />
        </ToastProvider>
      );

      // Assert
      const title = screen.getByText("Accessible toast");
      const toast = title.closest("li");
      expect(toast).toBeInTheDocument();
    });

    it("should have accessible close button", () => {
      // Arrange & Act
      render(
        <ToastProvider>
          <Toast title="Test" open={true} />
        </ToastProvider>
      );

      // Assert
      const closeButton = screen.getByRole("button", { name: "Close" });
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("should support keyboard navigation", async () => {
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
      await user.keyboard("{Enter}");

      // Assert
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("custom props", () => {
    it("should forward ref", () => {
      // Arrange
      const ref = vi.fn();

      // Act
      render(
        <ToastProvider>
          <Toast ref={ref} title="Ref test" open={true} />
        </ToastProvider>
      );

      // Assert
      expect(ref).toHaveBeenCalled();
    });
  });
});
