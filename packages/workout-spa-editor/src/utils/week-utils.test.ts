import { describe, expect, it } from "vitest";

import {
  getAdjacentWeekId,
  getCurrentWeekId,
  getWeekDays,
  getWeekIdForDate,
  parseWeekId,
} from "./week-utils";

describe("parseWeekId", () => {
  it("parses valid week ID", () => {
    const result = parseWeekId("2026-W15");

    expect(result).toEqual({
      weekId: "2026-W15",
      start: "2026-04-06",
      end: "2026-04-12",
    });
  });

  it("returns null for malformed input", () => {
    expect(parseWeekId("not-a-week")).toBeNull();
    expect(parseWeekId("2026-W00")).toBeNull();
    expect(parseWeekId("2026-W99")).toBeNull();
    expect(parseWeekId("")).toBeNull();
  });

  it("parses week 1 of the year", () => {
    const result = parseWeekId("2026-W01");

    expect(result).not.toBeNull();
    expect(result!.start).toBe("2025-12-29");
  });
});

describe("getCurrentWeekId", () => {
  it("returns a valid week ID format", () => {
    const weekId = getCurrentWeekId();

    expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getWeekIdForDate", () => {
  it("returns correct week ID for a known date", () => {
    const result = getWeekIdForDate(new Date("2026-04-11"));

    expect(result).toBe("2026-W15");
  });
});

describe("getAdjacentWeekId", () => {
  it("returns next week", () => {
    const result = getAdjacentWeekId("2026-W15", 1);

    expect(result).toBe("2026-W16");
  });

  it("returns previous week", () => {
    const result = getAdjacentWeekId("2026-W15", -1);

    expect(result).toBe("2026-W14");
  });

  it("handles year boundary", () => {
    const result = getAdjacentWeekId("2026-W01", -1);

    expect(result).toBe("2025-W52");
  });

  it("falls back to current week for invalid input", () => {
    const result = getAdjacentWeekId("invalid", 1);

    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getWeekDays", () => {
  it("returns 7 days for a valid week", () => {
    const days = getWeekDays("2026-W15");

    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-04-06");
    expect(days[6]).toBe("2026-04-12");
  });

  it("returns empty for invalid week", () => {
    const days = getWeekDays("invalid");

    expect(days).toHaveLength(0);
  });
});
