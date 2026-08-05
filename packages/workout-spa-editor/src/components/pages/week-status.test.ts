import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CalendarBuckets } from "./calendar-buckets";
import { buildWeekStatus, weekStatusIsSilent } from "./week-status";

const MONDAY = "2026-04-06";
const TUESDAY = "2026-04-07";
const RAW_COUNT = 4;
const TWO = 2;

const record = (state: WorkoutRecord["state"]): WorkoutRecord =>
  ({ state }) as WorkoutRecord;

const buckets = (
  overrides: Partial<CalendarBuckets> = {}
): CalendarBuckets => ({
  matchedByDay: {},
  soloPlansByDay: {},
  soloActualsByDay: {},
  ...overrides,
});

describe("buildWeekStatus", () => {
  it("should count matched sessions across every day of the week", () => {
    // Arrange
    const matched = {
      [MONDAY]: [{}, {}] as MatchedSessionWithMetadata[],
      [TUESDAY]: [{}] as MatchedSessionWithMetadata[],
    };

    // Act
    const status = buildWeekStatus(buckets({ matchedByDay: matched }), 0);

    // Assert
    expect(status.doneAndMatched).toBe(TWO + 1);
  });

  it("should count only the sessions that are ready and not yet pushed", () => {
    // Arrange
    const actuals = {
      [MONDAY]: [record("ready"), record("pushed"), record("raw")],
      [TUESDAY]: [record("ready")],
    };

    // Act
    const status = buildWeekStatus(buckets({ soloActualsByDay: actuals }), 0);

    // Assert
    expect(status.readyNotPushed).toBe(TWO);
  });

  it("should take the needs-structure count from the week's raw count", () => {
    // Arrange

    // Act
    const status = buildWeekStatus(buckets(), RAW_COUNT);

    // Assert
    expect(status.needsStructure).toBe(RAW_COUNT);
  });

  it("should not report a coach plan nobody has got to yet", () => {
    // Arrange
    const plans = {
      [MONDAY]: [{}, {}],
    } as unknown as CalendarBuckets["soloPlansByDay"];

    // Act
    const status = buildWeekStatus(buckets({ soloPlansByDay: plans }), 0);

    // Assert
    expect(weekStatusIsSilent(status)).toBe(true);
  });
});

describe("weekStatusIsSilent", () => {
  it("should be silent only when all three counts are zero", () => {
    // Arrange
    const silent = {
      doneAndMatched: 0,
      readyNotPushed: 0,
      needsStructure: 0,
    };

    // Act
    const loud = { ...silent, needsStructure: 1 };

    // Assert
    expect(weekStatusIsSilent(silent)).toBe(true);
    expect(weekStatusIsSilent(loud)).toBe(false);
  });
});
