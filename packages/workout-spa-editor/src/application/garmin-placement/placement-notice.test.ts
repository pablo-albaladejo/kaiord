import { describe, expect, it } from "vitest";

import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { currentRun, placementNotice } from "./placement-notice";
import { failed, type PlacementResult } from "./placement-result";
import type { Row } from "./placement-row";
import { POST_GATE_MS } from "./placement-timing";

const D1 = "2026-10-04";
const D2 = "2026-10-05";
const WORKOUT = "9";
const ATTEMPT_AT = "2026-10-01T08:00:00.000Z";

const entry = (
  overrides: Partial<GarminRemovalEntry> = {}
): GarminRemovalEntry =>
  ({
    workoutScheduleId: "7",
    workoutId: WORKOUT,
    date: D1,
    attempts: 3,
    abandoned: true,
    state: "retire",
    ...overrides,
  }) as GarminRemovalEntry;

const rowWith = (fields: Partial<Row>): Row =>
  ({ id: "row-1", kaiordRecordId: "record-1", ...fields }) as Row;

const UNCERTAIN = { kind: "uncertain", workoutId: WORKOUT, date: D2 };
const attempt = (posted: boolean) => ({
  kind: "attempting",
  workoutId: WORKOUT,
  date: D2,
  at: ATTEMPT_AT,
  posted,
  supersedes: [],
});

describe("placementNotice", () => {
  it("should derive uncertain from the ledger row, over any last run", () => {
    // Arrange
    const row = rowWith({ placement: UNCERTAIN } as Partial<Row>);
    const lastRun = failed("library-push-failed", true);

    // Act
    const notice = placementNotice(row, lastRun);

    // Assert
    expect(notice.result).toEqual({
      kind: "uncertain",
      date: D2,
      canConfirm: true,
    });
  });

  it("should withhold confirmation when a non-keep entry shares the date", () => {
    // Arrange
    const row = rowWith({
      placement: UNCERTAIN,
      removalQueue: [entry({ date: D2, state: "held", abandoned: false })],
    } as Partial<Row>);

    // Act
    const notice = placementNotice(row, undefined);

    // Assert
    expect(notice.result).toMatchObject({ canConfirm: false });
  });

  it("should never show an uncertain the row no longer holds", () => {
    // Arrange
    const row = rowWith({});
    const lastRun: PlacementResult = {
      kind: "uncertain",
      date: D2,
      canConfirm: true,
    };

    // Act
    const notice = placementNotice(row, lastRun);

    // Assert
    expect(notice).toEqual({ removable: [] });
  });

  it("should show the last run's outcome the ledger does not hold", () => {
    // Arrange
    const lastRun: PlacementResult = {
      kind: "library-only",
      reason: "bridge-outdated",
    };

    // Act
    const notice = placementNotice(undefined, lastRun);

    // Assert
    expect(notice.result).toEqual(lastRun);
  });

  it("should derive the left-behind warning from abandoned entries after a reload", () => {
    // Arrange
    const row = rowWith({ removalQueue: [entry()] });

    // Act
    const notice = placementNotice(row, undefined);

    // Assert
    expect(notice.result).toEqual({ kind: "duplicate-left", dates: [D1] });
    expect(notice.removable).toEqual([entry()]);
  });

  it("should list no held or undrained entry as dismissable", () => {
    // Arrange
    const row = rowWith({
      removalQueue: [
        entry({ state: "held", abandoned: false }),
        entry({ workoutScheduleId: "8", abandoned: false }),
      ],
    });

    // Act
    const notice = placementNotice(row, undefined);

    // Assert
    expect(notice).toEqual({ removable: [] });
  });

  it("should offer an unanswered posted attempt as uncertain, answerable after its gate", () => {
    // Arrange
    const row = rowWith({ placement: attempt(true) } as Partial<Row>);

    // Act
    const notice = placementNotice(row, undefined, false);

    // Assert
    expect(notice.result).toEqual({
      kind: "uncertain",
      date: D2,
      canConfirm: true,
      sendAfter: Date.parse(ATTEMPT_AT) + POST_GATE_MS,
    });
  });

  it.each([
    ["a posted attempt a live run holds", true, true],
    ["an attempt not yet posted", false, false],
  ])("should say nothing about %s", (_n, posted, inFlight) => {
    // Arrange
    const row = rowWith({ placement: attempt(posted) } as Partial<Row>);

    // Act
    const notice = placementNotice(row, undefined, inFlight);

    // Assert
    expect(notice).toEqual({ removable: [] });
  });
});

describe("currentRun", () => {
  it.each([
    {
      name: "a success on the workout's date",
      kind: "scheduled",
      date: D1,
      kept: true,
    },
    {
      name: "a success on a date the workout left",
      kind: "moved",
      date: D2,
      kept: false,
    },
    {
      name: "a left-behind warning on a date the workout left",
      kind: "duplicate-left",
      date: D2,
      kept: false,
    },
    {
      name: "a dateless outcome after a date change",
      kind: "library-only",
      date: D2,
      kept: true,
    },
  ])("should keep $name: $kept", ({ kind, date, kept }) => {
    // Arrange
    const run = {
      result: { kind, reason: "bridge-outdated", dates: [] } as PlacementResult,
      date,
    };

    // Act
    const current = currentRun(run, D1);

    // Assert
    expect(current).toBe(kept ? run : undefined);
  });
});
