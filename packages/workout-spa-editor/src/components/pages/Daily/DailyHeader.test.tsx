import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DailyHeader } from "./DailyHeader";

// A known Wednesday: 2026-06-10 (local).
const Y = 2026;
const JUN = 5;
const TENTH = 10;
const WED = new Date(Y, JUN, TENTH);

describe("DailyHeader", () => {
  it("should title the page Today with no reset when focus is today", () => {
    // Arrange
    const onBackToToday = vi.fn();

    // Act
    render(
      <DailyHeader
        focusDate={WED}
        isFocusToday={true}
        onBackToToday={onBackToToday}
      />
    );

    // Assert
    expect(screen.getByRole("heading")).toHaveTextContent("Today");
    expect(
      screen.queryByRole("button", { name: /Back to Today/ })
    ).not.toBeInTheDocument();
  });

  it("should show the focused weekday and a reset when focus is a past day", () => {
    // Arrange
    const onBackToToday = vi.fn();

    // Act
    render(
      <DailyHeader
        focusDate={WED}
        isFocusToday={false}
        onBackToToday={onBackToToday}
      />
    );
    screen.getByRole("button", { name: /Back to Today/ }).click();

    // Assert
    expect(screen.getByRole("heading")).toHaveTextContent("Wednesday");
    expect(onBackToToday).toHaveBeenCalledOnce();
  });
});
