import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DaySummary } from "./build-week-summary";
import type { WeekDay } from "./today-dates";
import { WeekStripColumn } from "./WeekStripColumn";

const DAY: WeekDay = {
  iso: "2026-04-29",
  letter: "W",
  dayNumber: 29,
  isFocused: false,
  isRealToday: false,
};

const summary = (o: Partial<DaySummary> = {}): DaySummary => ({
  count: 1,
  intensity: "moderate",
  estimated: false,
  ...o,
});

function renderColumn(day: WeekDay, s: DaySummary) {
  return render(<WeekStripColumn day={day} summary={s} onSelect={vi.fn()} />);
}

describe("WeekStripColumn", () => {
  it("should render a hairline when the day is empty", () => {
    // Arrange
    const s = summary({ count: 0, intensity: null });

    // Act
    renderColumn(DAY, s);

    // Assert
    expect(screen.getByTestId("weekstrip-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("weekstrip-dot")).not.toBeInTheDocument();
  });

  it("should render a filled dot for a measured intensity", () => {
    // Arrange
    const s = summary({ intensity: "hard", estimated: false });

    // Act
    renderColumn(DAY, s);

    // Assert
    const dot = screen.getByTestId("weekstrip-dot");
    expect(dot.className).toContain("bg-sky-400");
  });

  it("should render an outline dot for an estimated intensity", () => {
    // Arrange
    const s = summary({ intensity: "hard", estimated: true });

    // Act
    renderColumn(DAY, s);

    // Assert
    const dot = screen.getByTestId("weekstrip-dot");
    expect(dot.className).toContain("border");
  });

  it("should show the count when a day has two or more entries", () => {
    // Arrange
    const s = summary({ count: 3 });

    // Act
    renderColumn(DAY, s);

    // Assert
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should mark the real today with aria-current date", () => {
    // Arrange
    const today: WeekDay = { ...DAY, isRealToday: true };

    // Act
    renderColumn(today, summary());

    // Assert
    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "date");
  });
});
