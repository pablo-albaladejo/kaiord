import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DaySummary } from "./build-week-summary";
import { WeekStripMark } from "./WeekStripMark";

const SHORT_SEC = 1200; // 20 min
const LONG_SEC = 5400; // 90 min

const summary = (o: Partial<DaySummary> = {}): DaySummary => ({
  count: 1,
  intensity: "hard",
  estimated: false,
  sport: null,
  durationSec: null,
  ...o,
});

describe("WeekStripMark", () => {
  it("should render the sport glyph when a sport is known", () => {
    // Arrange
    const day = summary({ sport: "\u{1F6B4}" });

    // Act
    render(<WeekStripMark summary={day} />);

    // Assert
    expect(screen.getByTestId("weekstrip-sport")).toHaveTextContent(
      "\u{1F6B4}"
    );
    expect(screen.queryByTestId("weekstrip-dot")).toBeNull();
  });

  it("should fall back to the intensity dot when no sport is known", () => {
    // Arrange
    const day = summary({ sport: null });

    // Act
    render(<WeekStripMark summary={day} />);

    // Assert
    expect(screen.getByTestId("weekstrip-dot")).toBeInTheDocument();
    expect(screen.queryByTestId("weekstrip-sport")).toBeNull();
  });

  it("should render the empty hairline for a day with no entries", () => {
    // Arrange
    const day = summary({ count: 0, intensity: null });

    // Act
    render(<WeekStripMark summary={day} />);

    // Assert
    expect(screen.getByTestId("weekstrip-empty")).toBeInTheDocument();
  });

  it("should grow the sport glyph for a long session", () => {
    // Arrange
    const day = summary({ sport: "\u{1F6B4}", durationSec: LONG_SEC });

    // Act
    render(<WeekStripMark summary={day} />);

    // Assert
    expect(screen.getByTestId("weekstrip-sport").className).toContain(
      "text-[12px]"
    );
  });

  it("should shrink the dot for a short session", () => {
    // Arrange
    const day = summary({ sport: null, durationSec: SHORT_SEC });

    // Act
    render(<WeekStripMark summary={day} />);

    // Assert
    expect(screen.getByTestId("weekstrip-dot").className).toContain("h-1 w-1");
  });
});
