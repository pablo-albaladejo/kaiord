import { render, screen } from "@testing-library/react";
import { Heart, Zap } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("should render icon component", () => {
    // Arrange & Act
    render(<Icon icon={Heart} data-testid="icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toBeInTheDocument();
  });

  it("should apply default size classes", () => {
    // Arrange & Act
    render(<Icon icon={Heart} data-testid="icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("w-5", "h-5");
  });

  it("should apply size variant classes", () => {
    // Arrange & Act
    const { rerender } = render(
      <Icon icon={Heart} size="xs" data-testid="icon" />
    );

    // Assert
    let icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("w-3", "h-3");

    // Act
    rerender(<Icon icon={Heart} size="sm" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("w-4", "h-4");

    // Act
    rerender(<Icon icon={Heart} size="lg" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("w-6", "h-6");

    // Act
    rerender(<Icon icon={Heart} size="xl" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("w-8", "h-8");
  });

  it("should apply default color classes", () => {
    // Arrange & Act
    render(<Icon icon={Heart} data-testid="icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("text-gray-700", "dark:text-gray-200");
  });

  it("should apply color variant classes", () => {
    // Arrange & Act
    const { rerender } = render(
      <Icon icon={Heart} color="primary" data-testid="icon" />
    );

    // Assert
    let icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("text-primary-600", "dark:text-primary-400");

    // Act
    rerender(<Icon icon={Heart} color="success" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("text-green-600", "dark:text-green-400");

    // Act
    rerender(<Icon icon={Heart} color="danger" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("text-red-600", "dark:text-red-400");

    // Act
    rerender(<Icon icon={Heart} color="warning" data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("text-yellow-600", "dark:text-yellow-400");
  });

  it("should apply custom className", () => {
    // Arrange & Act
    render(<Icon icon={Heart} className="custom-class" data-testid="icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("custom-class");
  });

  it("should render different icon components", () => {
    // Arrange & Act
    const { rerender } = render(<Icon icon={Heart} data-testid="icon" />);

    // Assert
    let icon = screen.getByTestId("icon");
    expect(icon).toBeInTheDocument();

    // Act
    rerender(<Icon icon={Zap} data-testid="icon" />);

    // Assert
    icon = screen.getByTestId("icon");
    expect(icon).toBeInTheDocument();
  });

  it("should apply base classes", () => {
    // Arrange & Act
    render(<Icon icon={Heart} data-testid="icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "shrink-0"
    );
  });

  it("should forward ref", () => {
    // Arrange
    const ref = { current: null };

    // Act
    render(<Icon icon={Heart} ref={ref} />);

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("should pass through HTML attributes", () => {
    // Arrange & Act
    render(<Icon icon={Heart} data-testid="icon" aria-label="Heart icon" />);

    // Assert
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveAttribute("aria-label", "Heart icon");
  });
});
