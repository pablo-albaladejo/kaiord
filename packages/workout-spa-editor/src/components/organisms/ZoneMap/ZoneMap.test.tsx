import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ZoneMapEntry } from "./ZoneMap";
import { ZoneMap } from "./ZoneMap";

const FIXTURE: ZoneMapEntry[] = [
  { n: 1, name: "Active Recovery", range: "< 128 W", pct: "< 55%", w: 1 },
  { n: 2, name: "Endurance", range: "128–174 W", pct: "55–75%", w: 1 },
  { n: 3, name: "Tempo", range: "175–209 W", pct: "75–90%", w: 1 },
  { n: 4, name: "Threshold", range: "210–255 W", pct: "90–105%", w: 1 },
  { n: 5, name: "VO2 Max", range: "> 255 W", pct: "> 105%", w: 1 },
];

describe("ZoneMap", () => {
  it("should render a bar segment for each zone", () => {
    // Arrange
    const zones = FIXTURE;

    // Act
    const { container } = render(<ZoneMap zones={zones} />);

    // Assert
    const bar = container.querySelector(".flex.gap-\\[3px\\]");
    expect(bar?.children).toHaveLength(FIXTURE.length);
  });

  it("should render Z labels for each zone in the bar", () => {
    // Arrange
    const zones = FIXTURE;

    // Act
    render(<ZoneMap zones={zones} />);

    // Assert
    expect(screen.getByText("Z1")).toBeInTheDocument();
    expect(screen.getByText("Z2")).toBeInTheDocument();
    expect(screen.getByText("Z3")).toBeInTheDocument();
    expect(screen.getByText("Z4")).toBeInTheDocument();
    expect(screen.getByText("Z5")).toBeInTheDocument();
  });

  it("should render a legend row for each zone", () => {
    // Arrange
    const zones = FIXTURE;

    // Act
    render(<ZoneMap zones={zones} />);

    // Assert
    expect(screen.getByText("Active Recovery")).toBeInTheDocument();
    expect(screen.getByText("Endurance")).toBeInTheDocument();
    expect(screen.getByText("Tempo")).toBeInTheDocument();
    expect(screen.getByText("Threshold")).toBeInTheDocument();
    expect(screen.getByText("VO2 Max")).toBeInTheDocument();
  });

  it("should render range values in the legend", () => {
    // Arrange
    const zones = FIXTURE;

    // Act
    render(<ZoneMap zones={zones} />);

    // Assert
    expect(screen.getByText("< 128 W")).toBeInTheDocument();
    expect(screen.getByText("> 255 W")).toBeInTheDocument();
  });

  it("should apply custom className to root element", () => {
    // Arrange
    const zones = FIXTURE;

    // Act
    const { container } = render(
      <ZoneMap zones={zones} className="custom-class" />
    );

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root).toHaveClass("custom-class");
  });
});
