import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadinessRing } from "./ReadinessRing";

describe("ReadinessRing", () => {
  it("should render the score", () => {
    // Arrange

    // Act

    render(<ReadinessRing score={72} />);

    // Assert

    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("should render the default label READY", () => {
    // Arrange

    // Act

    render(<ReadinessRing score={50} />);

    // Assert

    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("should render a custom label", () => {
    // Arrange

    // Act

    render(<ReadinessRing score={50} label="HRV" />);

    // Assert

    expect(screen.getByText("HRV")).toBeInTheDocument();
  });

  it("should compute a smaller dashoffset for a higher score than a lower score", () => {
    // Arrange

    const { rerender } = render(<ReadinessRing score={20} />);
    const lowOffsetStr = screen
      .getByTestId("readiness-progress")
      .getAttribute("stroke-dashoffset");
    const lowOffset = parseFloat(lowOffsetStr ?? "0");

    // Act

    rerender(<ReadinessRing score={80} />);
    const highOffsetStr = screen
      .getByTestId("readiness-progress")
      .getAttribute("stroke-dashoffset");
    const highOffset = parseFloat(highOffsetStr ?? "0");

    // Assert

    expect(highOffset).toBeLessThan(lowOffset);
  });
});
