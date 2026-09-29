import { describe, expect, it } from "vitest";

import { failed } from "../garmin-placement/placement-result";
import { CALENDAR_WRITE_FEATURE } from "../garmin-placement/placement-timing";
import {
  isRetryable,
  mergeOutcomes,
  nextRetryAt,
  retryCandidates,
} from "./bulk-retry";
import type { BulkOutcome } from "./send-week-to-garmin";

const NOW = 1_000_000;
const LATER = 1_060_000;
const SOON = 1_030_000;
const DATE = "2026-10-05";
const WRITE = [CALENDAR_WRITE_FEATURE];

const outcome = (
  workoutId: string,
  result?: BulkOutcome["result"]
): BulkOutcome => ({
  workoutId,
  date: DATE,
  status: result?.kind ?? "not-eligible",
  ...(result ? { result } : { notEligible: "raw" as const }),
});

const OUTDATED = { kind: "library-only", reason: "bridge-outdated" } as const;

describe("isRetryable", () => {
  it.each([
    {
      name: "a retryable failure",
      result: failed("needs-reauth", true),
      features: WRITE,
      expected: true,
    },
    {
      name: "a failure whose retryAfter has passed",
      result: failed("settling", true, { retryAfter: NOW }),
      features: WRITE,
      expected: true,
    },
    {
      name: "a failure whose retryAfter is ahead",
      result: failed("settling", true, { retryAfter: LATER }),
      features: WRITE,
      expected: false,
    },
    {
      name: "a non-retryable failure",
      result: failed("schedule-rejected", false),
      features: WRITE,
      expected: false,
    },
    {
      name: "an outdated-bridge item once the bridge writes",
      result: OUTDATED,
      features: WRITE,
      expected: true,
    },
    {
      name: "an outdated-bridge item while still outdated",
      result: OUTDATED,
      features: [],
      expected: false,
    },
    {
      name: "an insecure-context item",
      result: { kind: "library-only", reason: "insecure-context" } as const,
      features: WRITE,
      expected: false,
    },
    {
      name: "an uncertain item",
      result: { kind: "uncertain", date: DATE, canConfirm: true } as const,
      features: WRITE,
      expected: false,
    },
    {
      name: "a scheduled item",
      result: { kind: "scheduled" } as const,
      features: WRITE,
      expected: false,
    },
    {
      name: "a not-eligible item",
      result: undefined,
      features: WRITE,
      expected: false,
    },
  ])(
    "should decide $name is retryable: $expected",
    ({ result, features, expected }) => {
      // Arrange
      const item = outcome("w-1", result);

      // Act
      const retryable = isRetryable(item, NOW, features);

      // Assert
      expect(retryable).toBe(expected);
    }
  );
});

describe("bulk retry selection", () => {
  it("should select only the retryable items as candidates", () => {
    // Arrange
    const run = [
      outcome("w-1", { kind: "scheduled" }),
      outcome("w-2", failed("needs-reauth", true)),
      outcome("w-3", failed("schedule-rejected", false)),
    ];

    // Act
    const candidates = retryCandidates(run, NOW, WRITE);

    // Assert
    expect(candidates).toEqual([{ workoutId: "w-2", date: DATE }]);
  });

  it("should give the earliest retryAfter still ahead", () => {
    // Arrange
    const run = [
      outcome("w-1", failed("settling", true, { retryAfter: LATER })),
      outcome("w-2", failed("settling", true, { retryAfter: SOON })),
      outcome("w-3", failed("settling", true, { retryAfter: NOW })),
    ];

    // Act
    const at = nextRetryAt(run, NOW);

    // Assert
    expect(at).toBe(SOON);
  });

  it("should give no retry time when nothing waits", () => {
    // Arrange
    const run = [outcome("w-1", { kind: "scheduled" })];

    // Act
    const at = nextRetryAt(run, NOW);

    // Assert
    expect(at).toBeUndefined();
  });

  it("should replace only the retried outcomes in place", () => {
    // Arrange
    const run = [
      outcome("w-1", { kind: "scheduled" }),
      outcome("w-2", failed("needs-reauth", true)),
    ];
    const retried = [outcome("w-2", { kind: "scheduled" })];

    // Act
    const merged = mergeOutcomes(run, retried);

    // Assert
    expect(merged).toEqual([run[0], retried[0]]);
  });
});
