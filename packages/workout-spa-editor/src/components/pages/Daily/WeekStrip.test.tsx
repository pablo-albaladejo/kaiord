import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { WeekSummary } from "./build-week-summary";
import type { WeekDay } from "./today-dates";
import { weekDays } from "./today-dates";
import { WeekStrip } from "./WeekStrip";

const DAYS_IN_WEEK = 7;
// A known week: Wed 2024-01-10 (Monday of that week is 2024-01-08).
const Y = 2024;
const JAN = 0;
const TENTH = 10;
const ANCHOR = new Date(Y, JAN, TENTH);
const REAL_ISO = "2024-01-10";

function emptySummary(days: WeekDay[]): WeekSummary {
  return Object.fromEntries(
    days.map((d) => [
      d.iso,
      {
        count: 0,
        intensity: null,
        estimated: false,
        sport: null,
        durationSec: null,
      },
    ])
  );
}

function renderStrip(
  days: WeekDay[],
  overrides: Partial<Parameters<typeof WeekStrip>[0]> = {}
) {
  const { hook } = memoryLocation({ path: "/daily", record: true });
  const onSelectDay = overrides.onSelectDay ?? vi.fn();
  const onPrev = overrides.onPrev ?? vi.fn();
  const onNext = overrides.onNext ?? vi.fn();
  return {
    onSelectDay,
    onPrev,
    onNext,
    ...render(
      <Router hook={hook}>
        <WeekStrip
          days={days}
          weekSummary={overrides.weekSummary ?? emptySummary(days)}
          onSelectDay={onSelectDay}
          onPrev={onPrev}
          onNext={onNext}
        />
      </Router>
    ),
  };
}

describe("WeekStrip", () => {
  it("should render a focus-select button per day", () => {
    // Arrange
    const days = weekDays(ANCHOR, REAL_ISO);

    // Act
    renderStrip(days);

    // Assert
    const dayButtons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.startsWith("Focus"));
    expect(dayButtons).toHaveLength(DAYS_IN_WEEK);
  });

  it("should select a day when its column is clicked", () => {
    // Arrange
    const days = weekDays(ANCHOR, REAL_ISO);
    const { onSelectDay } = renderStrip(days);

    // Act
    screen.getByRole("button", { name: /Focus M 8/ }).click();

    // Assert
    expect(onSelectDay).toHaveBeenCalledWith(days[0].iso);
  });

  it("should keep a dedicated open-in-calendar control", () => {
    // Arrange
    const days = weekDays(ANCHOR, REAL_ISO);

    // Act
    renderStrip(days);

    // Assert
    const link = screen.getByRole("link", { name: "Open week in calendar" });
    expect(link.getAttribute("href")).toMatch(/^\/calendar\/\d{4}-W\d{2}$/);
  });

  it("should fire prev/next day callbacks (unbounded, never disabled)", () => {
    // Arrange
    const days = weekDays(ANCHOR, REAL_ISO);
    const { onPrev, onNext } = renderStrip(days);

    // Act
    screen.getByRole("button", { name: "Previous day" }).click();
    screen.getByRole("button", { name: "Next day" }).click();

    // Assert
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Previous day" })
    ).not.toBeDisabled();
  });
});
