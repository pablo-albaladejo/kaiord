/**
 * Train2Go record mapper — tests
 *
 * Replaces the old `train2go-mapper.test.ts`. The mapper chain is now
 * Train2GoActivity → CoachingActivityRecord (this file) →
 * CoachingActivity (coaching-record-to-activity.mapper.ts).
 */

import { describe, expect, it } from "vitest";

import type { Train2GoActivity } from "../../store/train2go-extension-transport";
import {
  TRAIN2GO_STATUS_MAP,
  toCoachingActivityRecord,
} from "./train2go-record.converter";

const base: Train2GoActivity = {
  id: 12345,
  date: "2026-04-13",
  sport: "cycling",
  title: "FTP test",
  duration: "01:30:00",
  workload: 4,
  status: 0,
};

const NOW = "2026-04-28T10:00:00.000Z";

describe("toCoachingActivityRecord", () => {
  it("produces composite id and stringifies sourceId at the boundary", () => {
    const result = toCoachingActivityRecord("p1", base, NOW);

    expect(result.id).toBe("p1:train2go:12345");
    expect(result.sourceId).toBe("12345");
    expect(typeof result.sourceId).toBe("string");
  });

  it("preserves raw workload unclamped and computes intensity 1..5", () => {
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: 7 },
      NOW
    );

    expect(result.workload).toBe(7);
    expect(result.intensity).toBe(5);
  });

  it("rounds non-integer workloads to a literal intensity (no decimals)", () => {
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: 4.7 },
      NOW
    );

    expect(result.workload).toBe(4.7);
    expect(result.intensity).toBe(5);
    expect(Number.isInteger(result.intensity)).toBe(true);
  });

  it("emits intensity undefined when workload is 0", () => {
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, workload: 0 },
      NOW
    );

    expect(result.workload).toBe(0);
    expect(result.intensity).toBeUndefined();
  });

  it.each([
    [0, "pending"],
    [1, "completed"],
    [-1, "skipped"],
  ] as const)("maps status %s → %s", (code, expected) => {
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, status: code },
      NOW
    );

    expect(result.status).toBe(expected);
  });

  it("falls back to pending for unknown status codes", () => {
    const result = toCoachingActivityRecord("p1", { ...base, status: 99 }, NOW);

    expect(result.status).toBe("pending");
  });

  it("carries completion → completionPercent", () => {
    const result = toCoachingActivityRecord(
      "p1",
      { ...base, completion: 85 },
      NOW
    );

    expect(result.completionPercent).toBe(85);
  });

  it("STATUS_MAP parity test — guards against drift", () => {
    expect(TRAIN2GO_STATUS_MAP).toEqual({
      0: "pending",
      1: "completed",
      [-1]: "skipped",
    });
  });
});
