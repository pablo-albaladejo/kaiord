import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { recentYearMonths, useUsageSummary } from "./use-usage-summary";

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [],
}));

vi.mock("../adapters/dexie/dexie-database", () => ({
  db: {},
}));

vi.mock("../adapters/dexie/dexie-usage-event-repository", () => ({
  createDexieUsageEventRepository: () => ({
    listByMonths: () => Promise.resolve([]),
  }),
}));

const SIX_MONTHS = 6;
const ONE_MONTH = 1;

describe("recentYearMonths", () => {
  it("should return the current month first", () => {
    // Arrange
    const now = new Date("2026-07-28T10:00:00.000Z");

    // Act
    const months = recentYearMonths(ONE_MONTH, now);

    // Assert
    expect(months).toEqual(["2026-07"]);
  });

  it("should walk backwards across a year boundary", () => {
    // Arrange
    const now = new Date("2026-02-15T00:00:00.000Z");

    // Act
    const months = recentYearMonths(SIX_MONTHS, now);

    // Assert
    expect(months).toEqual([
      "2026-02",
      "2026-01",
      "2025-12",
      "2025-11",
      "2025-10",
      "2025-09",
    ]);
  });

  it("should zero-pad single-digit months", () => {
    // Arrange
    const now = new Date("2026-09-30T23:59:59.000Z");

    // Act
    const months = recentYearMonths(ONE_MONTH, now);

    // Assert
    expect(months).toEqual(["2026-09"]);
  });
});

describe("useUsageSummary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should roll its window forward when the month changes mid-session", () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T23:59:00.000Z"));
    const { result, rerender } = renderHook(() => useUsageSummary(ONE_MONTH));
    expect(result.current.months).toEqual(["2026-07"]);

    // Act
    vi.setSystemTime(new Date("2026-08-01T00:01:00.000Z"));
    rerender();

    // Assert
    expect(result.current.months).toEqual(["2026-08"]);
  });
});
