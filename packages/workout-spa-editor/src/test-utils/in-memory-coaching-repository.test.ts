/**
 * In-Memory Coaching Repository — behavior tests
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { CoachingRepository } from "../ports/persistence-port";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../types/coaching-activity-record";
import { createInMemoryCoachingRepository } from "./in-memory-coaching-repository";

const makeRecord = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => {
  const profileId = overrides.profileId ?? "p1";
  const source = overrides.source ?? "train2go";
  const sourceId = overrides.sourceId ?? "12345";
  return {
    id: buildCoachingActivityId(profileId, source, sourceId),
    profileId,
    source,
    sourceId,
    date: "2026-04-13",
    sport: "cycling",
    title: "FTP test",
    status: "pending",
    fetchedAt: "2026-04-28T10:00:00.000Z",
    ...overrides,
  };
};

describe("InMemoryCoachingRepository", () => {
  let repo: CoachingRepository;
  beforeEach(() => {
    repo = createInMemoryCoachingRepository();
  });

  it("upsertMany is idempotent on identical input", async () => {
    const r = makeRecord();
    await repo.upsertMany([r]);
    await repo.upsertMany([r]);

    const all = await repo.getByProfileAndDateRange(
      "p1",
      "2026-04-01",
      "2026-05-01"
    );
    expect(all).toHaveLength(1);
  });

  it("upsertMany overwrites existing rows by composite id", async () => {
    const a = makeRecord({ title: "Old" });
    const b = makeRecord({ title: "New" });
    await repo.upsertMany([a]);
    await repo.upsertMany([b]);

    const result = await repo.getById(a.id);
    expect(result?.title).toBe("New");
  });

  it("getByProfileAndDateRange filters by profile and date inclusively", async () => {
    const inside = makeRecord({ date: "2026-04-13", sourceId: "1" });
    const before = makeRecord({ date: "2026-04-12", sourceId: "2" });
    const after = makeRecord({ date: "2026-04-20", sourceId: "3" });
    const otherProfile = makeRecord({ profileId: "p2", sourceId: "4" });
    await repo.upsertMany([inside, before, after, otherProfile]);

    const result = await repo.getByProfileAndDateRange(
      "p1",
      "2026-04-13",
      "2026-04-19"
    );

    expect(result.map((r) => r.sourceId).sort()).toEqual(["1"]);
  });

  it("does not leak rows from other profiles (profile isolation)", async () => {
    await repo.upsertMany([
      makeRecord({ profileId: "p1", sourceId: "1" }),
      makeRecord({ profileId: "p2", sourceId: "2" }),
    ]);

    const p1 = await repo.getByProfileAndDateRange(
      "p1",
      "2026-01-01",
      "2026-12-31"
    );
    const p2 = await repo.getByProfileAndDateRange(
      "p2",
      "2026-01-01",
      "2026-12-31"
    );

    expect(p1).toHaveLength(1);
    expect(p1[0]?.profileId).toBe("p1");
    expect(p2).toHaveLength(1);
    expect(p2[0]?.profileId).toBe("p2");
  });

  it("getByProfileAndSourceId scopes by profile", async () => {
    await repo.upsertMany([
      makeRecord({ profileId: "p1", sourceId: "shared" }),
      makeRecord({ profileId: "p2", sourceId: "shared" }),
    ]);

    const p1 = await repo.getByProfileAndSourceId("p1", "train2go", "shared");
    const p2 = await repo.getByProfileAndSourceId("p2", "train2go", "shared");

    expect(p1?.profileId).toBe("p1");
    expect(p2?.profileId).toBe("p2");
  });

  it("delete is a no-op when the id does not exist", async () => {
    await expect(repo.delete("does-not-exist")).resolves.toBeUndefined();
  });

  it("deleteByProfile removes only the targeted profile's rows", async () => {
    await repo.upsertMany([
      makeRecord({ profileId: "p1", sourceId: "1" }),
      makeRecord({ profileId: "p1", sourceId: "2" }),
      makeRecord({ profileId: "p2", sourceId: "3" }),
    ]);

    await repo.deleteByProfile("p1");

    const p1 = await repo.getByProfileAndDateRange(
      "p1",
      "2026-01-01",
      "2026-12-31"
    );
    const p2 = await repo.getByProfileAndDateRange(
      "p2",
      "2026-01-01",
      "2026-12-31"
    );
    expect(p1).toHaveLength(0);
    expect(p2).toHaveLength(1);
  });

  it("upsertMany([]) is a no-op", async () => {
    await expect(repo.upsertMany([])).resolves.toBeUndefined();
  });
});
