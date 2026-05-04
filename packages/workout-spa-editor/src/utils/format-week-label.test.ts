import { describe, expect, it } from "vitest";

import { formatWeekLabel } from "./format-week-label";

describe("formatWeekLabel", () => {
  it("should format a same-month week", () => {
    expect(formatWeekLabel("2026-W18")).toBe("Apr 27 – May 3 · W18");
  });

  it("should format a same-year cross-month week", () => {
    expect(formatWeekLabel("2026-W19")).toBe("May 4 – May 10 · W19");
  });

  it("should format a cross-year week with year disambiguation", () => {
    expect(formatWeekLabel("2026-W01")).toBe(
      "Dec 29, 2025 – Jan 4, 2026 · W01"
    );
  });

  it("should fall back to the raw weekId on invalid input", () => {
    expect(formatWeekLabel("not-a-week")).toBe("not-a-week");
  });

  it("should be deterministic", () => {
    expect(formatWeekLabel("2026-W18")).toBe(formatWeekLabel("2026-W18"));
  });
});
