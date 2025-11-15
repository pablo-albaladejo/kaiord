import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ValidationError } from "../../../types/krd";
import { ErrorMessage } from "./ErrorMessage";

describe("ErrorMessage", () => {
  it("should render error title", () => {
    // Arrange & Act
    render(<ErrorMessage title="Error occurred" />);

    // Assert
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("should render error message when provided", () => {
    // Arrange & Act
    render(
      <ErrorMessage
        title="Error occurred"
        message="Something went wrong with the file"
      />
    );

    // Assert
    expect(
      screen.getByText("Something went wrong with the file")
    ).toBeInTheDocument();
  });

  it("should render validation errors when provided", () => {
    // Arrange
    const validationErrors: Array<ValidationError> = [
      { path: ["version"], message: "Required field missing" },
      { path: ["type"], message: "Invalid value" },
    ];

    // Act
    render(
      <ErrorMessage
        title="Validation failed"
        validationErrors={validationErrors}
      />
    );

    // Assert
    expect(screen.getByText("Validation errors:")).toBeInTheDocument();
    expect(screen.getByText("version")).toBeInTheDocument();
    expect(screen.getByText(/Required field missing/)).toBeInTheDocument();
    expect(screen.getByText("type")).toBeInTheDocument();
    expect(screen.getByText(/Invalid value/)).toBeInTheDocument();
  });

  it("should call onRetry when Try Again button is clicked", async () => {
    // Arrange
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage title="Error occurred" onRetry={onRetry} />);

    // Act
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Assert
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("should call onDismiss when Dismiss button is clicked", async () => {
    // Arrange
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage title="Error occurred" onDismiss={onDismiss} />);

    // Act
    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    // Assert
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("should render both retry and dismiss buttons when both callbacks provided", () => {
    // Arrange & Act
    render(
      <ErrorMessage
        title="Error occurred"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dismiss/i })
    ).toBeInTheDocument();
  });

  it("should not render buttons when no callbacks provided", () => {
    // Arrange & Act
    render(<ErrorMessage title="Error occurred" />);

    // Assert
    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /dismiss/i })
    ).not.toBeInTheDocument();
  });

  it("should have alert role for accessibility", () => {
    // Arrange & Act
    render(<ErrorMessage title="Error occurred" />);

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("should apply custom className", () => {
    // Arrange & Act
    const { container } = render(
      <ErrorMessage title="Error occurred" className="custom-class" />
    );

    // Assert
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
