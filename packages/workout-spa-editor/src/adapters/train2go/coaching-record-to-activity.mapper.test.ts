import { describe, expect, it } from "vitest";

import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import { toCoachingActivity } from "./coaching-record-to-activity.mapper";

const baseRecord: CoachingActivityRecord = {
  id: buildCoachingActivityId("p1", "train2go", "12345"),
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "Z2 60'",
  duration: "01:00:00",
  workload: 4,
  intensity: 3,
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
};

describe("toCoachingActivity (record → view-model)", () => {
  it("builds a stable view-model id of the form `${source}:${sourceId}`", () => {
    const result = toCoachingActivity(baseRecord);

    expect(result.id).toBe("train2go:12345");
    expect(result.source).toBe("train2go");
  });

  it("uses T2G as badge for train2go source", () => {
    const result = toCoachingActivity(baseRecord);
    expect(result.sourceBadge).toBe("T2G");
  });

  it("falls back to upper-cased source label for unknown badges", () => {
    const result = toCoachingActivity({ ...baseRecord, source: "future-src" });
    expect(result.sourceBadge).toBe("FUTURE-SRC");
  });

  it("maps duration / status / intensity fields through", () => {
    const result = toCoachingActivity(baseRecord);

    expect(result.duration).toBe("01:00:00");
    expect(result.status).toBe("pending");
    expect(result.effort).toBe(3);
  });

  it("omits empty duration", () => {
    const result = toCoachingActivity({ ...baseRecord, duration: "" });
    expect(result.duration).toBeUndefined();
  });
});
