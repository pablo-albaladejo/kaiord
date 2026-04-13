import { describe, expect, it } from "vitest";

import { toCoachingActivity } from "./train2go-mapper";

const baseActivity = {
  id: 123,
  date: "2026-04-13",
  sport: "cycling",
  title: "Intervals",
  duration: "1:30 h",
  workload: 3,
  status: 0,
};

describe("toCoachingActivity", () => {
  it("maps all fields correctly", () => {
    const result = toCoachingActivity(baseActivity);

    expect(result).toMatchObject({
      id: "train2go:123",
      source: "train2go",
      sourceBadge: "T2G",
      date: "2026-04-13",
      title: "Intervals",
      duration: "1:30 h",
      effort: 3,
      status: "pending",
    });
    expect(result.sport.label).toBe("Cycling");
  });

  it("maps status 1 to completed", () => {
    const result = toCoachingActivity({ ...baseActivity, status: 1 });
    expect(result.status).toBe("completed");
  });

  it("maps status -1 to skipped", () => {
    const result = toCoachingActivity({ ...baseActivity, status: -1 });
    expect(result.status).toBe("skipped");
  });

  it("defaults unknown status to pending", () => {
    const result = toCoachingActivity({ ...baseActivity, status: 99 });
    expect(result.status).toBe("pending");
  });

  it("returns undefined effort when workload is 0", () => {
    const result = toCoachingActivity({ ...baseActivity, workload: 0 });
    expect(result.effort).toBeUndefined();
  });

  it("clamps effort to max 5", () => {
    const result = toCoachingActivity({ ...baseActivity, workload: 10 });
    expect(result.effort).toBe(5);
  });

  it("clamps effort to min 1", () => {
    const result = toCoachingActivity({ ...baseActivity, workload: -3 });
    expect(result.effort).toBeUndefined();
  });

  it("returns undefined duration for empty string", () => {
    const result = toCoachingActivity({ ...baseActivity, duration: "" });
    expect(result.duration).toBeUndefined();
  });
});
