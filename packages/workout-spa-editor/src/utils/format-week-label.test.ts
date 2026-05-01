import { describe, expect, it } from "vitest";

import { formatWeekLabel } from "./format-week-label";

describe("formatWeekLabel", () => {
  it("formats a same-month week", () => {
    expect(formatWeekLabel("2026-W18")).toBe("Apr 27 – May 3 · W18");
  });

  it("formats a same-year cross-month week", () => {
    expect(formatWeekLabel("2026-W19")).toBe("May 4 – May 10 · W19");
  });

  it("formats a cross-year week with year disambiguation", () => {
    expect(formatWeekLabel("2026-W01")).toBe(
      "Dec 29, 2025 – Jan 4, 2026 · W01"
    );
  });

  it("falls back to the raw weekId on invalid input", () => {
    expect(formatWeekLabel("not-a-week")).toBe("not-a-week");
  });

  it("is deterministic", () => {
    expect(formatWeekLabel("2026-W18")).toBe(formatWeekLabel("2026-W18"));
  });
});
