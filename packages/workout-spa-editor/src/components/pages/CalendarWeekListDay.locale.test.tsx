import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { CalendarWeekListDay } from "./CalendarWeekListDay";

vi.mock("../../i18n/LocaleProvider", () => ({ useActiveLocale: () => "es" }));

describe("CalendarWeekListDay in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should write the day heading in Spanish date order", () => {
    // Arrange
    const date = "2026-10-05";

    // Act
    render(
      <CalendarWeekListDay
        date={date}
        matched={[]}
        plans={[]}
        actuals={[]}
        isToday={false}
        wellnessResolved={false}
        onWorkoutClick={vi.fn()}
        onAddClick={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "lun, 5 oct"
    );
    expect(
      screen.getByRole("button", { name: "Añadir a lun, 5 oct" })
    ).toBeVisible();
  });
});
