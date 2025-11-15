import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("should render with default variant and size", () => {
    render(<Badge>Test Badge</Badge>);

    const badge = screen.getByText("Test Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("px-2.5");
  });

  it("should render with warmup variant", () => {
    render(<Badge variant="warmup">Warmup</Badge>);

    const badge = screen.getByText("Warmup");
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-800");
  });

  it("should render with active variant", () => {
    render(<Badge variant="active">Active</Badge>);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-800");
  });

  it("should render with cooldown variant", () => {
    render(<Badge variant="cooldown">Cooldown</Badge>);

    const badge = screen.getByText("Cooldown");
    expect(badge).toHaveClass("bg-cyan-100");
    expect(badge).toHaveClass("text-cyan-800");
  });

  it("should render with rest variant", () => {
    render(<Badge variant="rest">Rest</Badge>);

    const badge = screen.getByText("Rest");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });

  it("should render with power target variant", () => {
    render(<Badge variant="power">Power</Badge>);

    const badge = screen.getByText("Power");
    expect(badge).toHaveClass("bg-yellow-100");
    expect(badge).toHaveClass("text-yellow-800");
  });

  it("should render with heart_rate target variant", () => {
    render(<Badge variant="heart_rate">Heart Rate</Badge>);

    const badge = screen.getByText("Heart Rate");
    expect(badge).toHaveClass("bg-pink-100");
    expect(badge).toHaveClass("text-pink-800");
  });

  it("should render with cadence target variant", () => {
    render(<Badge variant="cadence">Cadence</Badge>);

    const badge = screen.getByText("Cadence");
    expect(badge).toHaveClass("bg-indigo-100");
    expect(badge).toHaveClass("text-indigo-800");
  });

  it("should render with pace target variant", () => {
    render(<Badge variant="pace">Pace</Badge>);

    const badge = screen.getByText("Pace");
    expect(badge).toHaveClass("bg-teal-100");
    expect(badge).toHaveClass("text-teal-800");
  });

  it("should render with open target variant", () => {
    render(<Badge variant="open">Open</Badge>);

    const badge = screen.getByText("Open");
    expect(badge).toHaveClass("bg-slate-100");
    expect(badge).toHaveClass("text-slate-800");
  });

  it("should render with small size", () => {
    render(<Badge size="sm">Small</Badge>);

    const badge = screen.getByText("Small");
    expect(badge).toHaveClass("px-2");
    expect(badge).toHaveClass("text-xs");
  });

  it("should render with medium size", () => {
    render(<Badge size="md">Medium</Badge>);

    const badge = screen.getByText("Medium");
    expect(badge).toHaveClass("px-2.5");
    expect(badge).toHaveClass("text-sm");
  });

  it("should render with large size", () => {
    render(<Badge size="lg">Large</Badge>);

    const badge = screen.getByText("Large");
    expect(badge).toHaveClass("px-3");
    expect(badge).toHaveClass("text-base");
  });

  it("should render with icon", () => {
    const icon = <span data-testid="test-icon">⚡</span>;
    render(<Badge icon={icon}>With Icon</Badge>);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("custom-class");
  });

  it("should forward ref", () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Test</Badge>);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("should support all intensity variants", () => {
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
