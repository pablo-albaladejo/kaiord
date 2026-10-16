import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../i18n/i18n";
import { formatWeekLabel } from "./format-week-label";

describe("formatWeekLabel", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should format a same-month week", () => {
    // Arrange

    // Act

    // Assert
    expect(formatWeekLabel("2026-W18")).toBe("Apr 27 – May 3 · W18");
  });

  it("should format a same-year cross-month week", () => {
    // Arrange

    // Act

    // Assert
    expect(formatWeekLabel("2026-W19")).toBe("May 4 – May 10 · W19");
  });

  it("should format a cross-year week with year disambiguation", () => {
    // Arrange

    // Act

    // Assert
    expect(formatWeekLabel("2026-W01")).toBe(
      "Dec 29, 2025 – Jan 4, 2026 · W01"
    );
  });

  it("should fall back to the raw weekId on invalid input", () => {
    // Arrange

    // Act

    // Assert
    expect(formatWeekLabel("not-a-week")).toBe("not-a-week");
  });

  it("should name the days and the week in Spanish", () => {
    // Arrange
    const weekId = "2026-W41";

    // Act
    const label = formatWeekLabel(weekId, "es");

    // Assert
    expect(label).toBe("5 oct – 11 oct · S41");
  });

  it("should give both years in Spanish when the week crosses a year", () => {
    // Arrange
    const weekId = "2026-W01";

    // Act
    const label = formatWeekLabel(weekId, "es");

    // Assert
    expect(label).toBe("29 dic 2025 – 4 ene 2026 · S01");
  });
});
