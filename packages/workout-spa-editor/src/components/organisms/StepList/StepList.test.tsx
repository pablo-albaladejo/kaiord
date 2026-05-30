import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { StepListItem } from "./StepList";
import { StepList } from "./StepList";

const steps: StepListItem[] = [
  { kind: "Warmup", detail: "10 min easy", zone: 1, dur: "10:00" },
  { kind: "Interval", detail: "4 × 4 min @ 115% FTP", zone: 4, dur: "16:00" },
  { kind: "Cooldown", detail: "5 min easy spin", zone: 2, dur: "05:00" },
];

describe("StepList", () => {
  it("should render a row per step with kind detail dur and zone label", () => {
    // Arrange

    render(<StepList steps={steps} />);

    // Act

    const warmup = screen.getByText("Warmup");
    const interval = screen.getByText("Interval");
    const cooldown = screen.getByText("Cooldown");

    // Assert

    expect(warmup).toBeInTheDocument();
    expect(interval).toBeInTheDocument();
    expect(cooldown).toBeInTheDocument();
    expect(screen.getByText("10 min easy")).toBeInTheDocument();
    expect(screen.getByText("4 × 4 min @ 115% FTP")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("16:00")).toBeInTheDocument();
    expect(screen.getByText("Z1")).toBeInTheDocument();
    expect(screen.getByText("Z4")).toBeInTheDocument();
  });

  it("should omit the bottom border class on the last row only", () => {
    // Arrange

    const { container } = render(<StepList steps={steps} />);

    // Act

    const rows = container.querySelectorAll(".py-3");

    // Assert

    expect(rows).toHaveLength(steps.length);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i]).toHaveClass("border-b");
    }
    expect(rows[rows.length - 1]).not.toHaveClass("border-b");
  });

  it("should apply custom className to the root element", () => {
    // Arrange

    const { container } = render(
      <StepList steps={steps} className="my-step-list" />
    );

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    expect(root).toHaveClass("my-step-list");
  });
});
