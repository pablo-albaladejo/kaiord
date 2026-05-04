import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("should render with default variant and size", () => {
    // Arrange

    render(<Badge>Test Badge</Badge>);

    // Act

    const badge = screen.getByText("Test Badge");

    // Assert

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("px-2.5");
  });

  it("should render with warmup variant", () => {
    // Arrange

    render(<Badge variant="warmup">Warmup</Badge>);

    // Act

    const badge = screen.getByText("Warmup");

    // Assert

    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-800");
  });

  it("should render with active variant", () => {
    // Arrange

    render(<Badge variant="active">Active</Badge>);

    // Act

    const badge = screen.getByText("Active");

    // Assert

    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-800");
  });

  it("should render with cooldown variant", () => {
    // Arrange

    render(<Badge variant="cooldown">Cooldown</Badge>);

    // Act

    const badge = screen.getByText("Cooldown");

    // Assert

    expect(badge).toHaveClass("bg-cyan-100");
    expect(badge).toHaveClass("text-cyan-800");
  });

  it("should render with rest variant", () => {
    // Arrange

    render(<Badge variant="rest">Rest</Badge>);

    // Act

    const badge = screen.getByText("Rest");

    // Assert

    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });

  it("should render with power target variant", () => {
    // Arrange

    render(<Badge variant="power">Power</Badge>);

    // Act

    const badge = screen.getByText("Power");

    // Assert

    expect(badge).toHaveClass("bg-yellow-100");
    expect(badge).toHaveClass("text-yellow-800");
  });

  it("should render with heart_rate target variant", () => {
    // Arrange

    render(<Badge variant="heart_rate">Heart Rate</Badge>);

    // Act

    const badge = screen.getByText("Heart Rate");

    // Assert

    expect(badge).toHaveClass("bg-pink-100");
    expect(badge).toHaveClass("text-pink-800");
  });

  it("should render with cadence target variant", () => {
    // Arrange

    render(<Badge variant="cadence">Cadence</Badge>);

    // Act

    const badge = screen.getByText("Cadence");

    // Assert

    expect(badge).toHaveClass("bg-indigo-100");
    expect(badge).toHaveClass("text-indigo-800");
  });

  it("should render with pace target variant", () => {
    // Arrange

    render(<Badge variant="pace">Pace</Badge>);

    // Act

    const badge = screen.getByText("Pace");

    // Assert

    expect(badge).toHaveClass("bg-teal-100");
    expect(badge).toHaveClass("text-teal-800");
  });

  it("should render with open target variant", () => {
    // Arrange

    render(<Badge variant="open">Open</Badge>);

    // Act

    const badge = screen.getByText("Open");

    // Assert

    expect(badge).toHaveClass("bg-slate-100");
    expect(badge).toHaveClass("text-slate-800");
  });

  it("should render with small size", () => {
    // Arrange

    render(<Badge size="sm">Small</Badge>);

    // Act

    const badge = screen.getByText("Small");

    // Assert

    expect(badge).toHaveClass("px-2");
    expect(badge).toHaveClass("text-xs");
  });

  it("should render with medium size", () => {
    // Arrange

    render(<Badge size="md">Medium</Badge>);

    // Act

    const badge = screen.getByText("Medium");

    // Assert

    expect(badge).toHaveClass("px-2.5");
    expect(badge).toHaveClass("text-sm");
  });

  it("should render with large size", () => {
    // Arrange

    render(<Badge size="lg">Large</Badge>);

    // Act

    const badge = screen.getByText("Large");

    // Assert

    expect(badge).toHaveClass("px-3");
    expect(badge).toHaveClass("text-base");
  });

  it("should render with icon", () => {
    // Arrange

    const icon = <span data-testid="test-icon">⚡</span>;

    // Act

    render(<Badge icon={icon}>With Icon</Badge>);

    // Assert

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    // Arrange

    render(<Badge className="custom-class">Custom</Badge>);

    // Act

    const badge = screen.getByText("Custom");

    // Assert

    expect(badge).toHaveClass("custom-class");
  });

  it("should forward ref", () => {
    // Arrange

    const ref = { current: null };

    // Act

    render(<Badge ref={ref}>Ref Test</Badge>);

    // Assert

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("should support all intensity variants", () => {
    // Arrange

    // Act

    // Assert

    const intensities = [
      "warmup",
      "active",
      "cooldown",
      "rest",
      "recovery",
      "interval",
      "other",
    ] as const;

    intensities.forEach((intensity) => {
      const { unmount } = render(
        <Badge variant={intensity}>{intensity}</Badge>
      );
      expect(screen.getByText(intensity)).toBeInTheDocument();
      unmount();
    });
  });

  it("should support all target type variants", () => {
    // Arrange

    // Act

    // Assert

    const targets = [
      "power",
      "heart_rate",
      "cadence",
      "pace",
      "stroke_type",
      "open",
    ] as const;

    targets.forEach((target) => {
      const { unmount } = render(<Badge variant={target}>{target}</Badge>);
      expect(screen.getByText(target)).toBeInTheDocument();
      unmount();
    });
  });
});
