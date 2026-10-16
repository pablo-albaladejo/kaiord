import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { WeekDay } from "./today-dates";
import { WeekStripColumn } from "./WeekStripColumn";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const WEDNESDAY: WeekDay = {
  iso: "2026-04-29",
  dayNumber: 29,
  isFocused: false,
  isRealToday: true,
};

describe("WeekStripColumn in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should letter and announce the day in Spanish", () => {
    // Arrange
    const summary = {
      count: 2,
      intensity: "hard" as const,
      estimated: true,
      sport: null,
      durationSec: null,
    };

    // Act
    render(
      <WeekStripColumn day={WEDNESDAY} summary={summary} onSelect={vi.fn()} />
    );

    // Assert
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("X");
    expect(button).toHaveAttribute(
      "aria-label",
      "Ver X 29 (hoy), 2 planificadas, intensa estimada"
    );
  });
});
