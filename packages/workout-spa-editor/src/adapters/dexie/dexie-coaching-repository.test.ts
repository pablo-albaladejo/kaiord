import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import { createDexieCoachingRepository } from "./dexie-coaching-repository";
import { KaiordDatabase } from "./dexie-database";

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

describe("DexieCoachingRepository", () => {
  let db: KaiordDatabase;
  beforeEach(() => {
    db = new KaiordDatabase(
      `kaiord-coaching-test-${Date.now()}-${Math.random()}`
    );
  });

  it("upserts via composite primary key (idempotent)", async () => {
    const repo = createDexieCoachingRepository(db);
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

  it("getByProfileAndDateRange filters by profile and inclusive date range", async () => {
    const repo = createDexieCoachingRepository(db);
    await repo.upsertMany([
      makeRecord({ date: "2026-04-13", sourceId: "1" }),
      makeRecord({ date: "2026-04-19", sourceId: "2" }),
      makeRecord({ date: "2026-04-20", sourceId: "3" }),
      makeRecord({ profileId: "p2", date: "2026-04-15", sourceId: "4" }),
    ]);

    const result = await repo.getByProfileAndDateRange(
      "p1",
      "2026-04-13",
      "2026-04-19"
    );

    expect(result.map((r) => r.sourceId).sort()).toEqual(["1", "2"]);
  });

  it("getByProfileAndSourceId scopes lookup by profile (no cross-profile leak)", async () => {
    const repo = createDexieCoachingRepository(db);
    await repo.upsertMany([
      makeRecord({ profileId: "p1", sourceId: "shared" }),
      makeRecord({ profileId: "p2", sourceId: "shared" }),
    ]);

    const p1 = await repo.getByProfileAndSourceId("p1", "train2go", "shared");
    const p2 = await repo.getByProfileAndSourceId("p2", "train2go", "shared");

    expect(p1?.profileId).toBe("p1");
    expect(p2?.profileId).toBe("p2");
  });

  it("delete is a no-op when the row does not exist", async () => {
    const repo = createDexieCoachingRepository(db);
    await expect(repo.delete("missing-id")).resolves.toBeUndefined();
  });

  it("deleteByProfile removes only the targeted profile's rows", async () => {
    const repo = createDexieCoachingRepository(db);
    await repo.upsertMany([
      makeRecord({ profileId: "p1", sourceId: "1", date: "2026-04-13" }),
      makeRecord({ profileId: "p1", sourceId: "2", date: "2026-05-13" }),
      makeRecord({ profileId: "p2", sourceId: "3" }),
    ]);

    await repo.deleteByProfile("p1");

    expect(
      await repo.getByProfileAndDateRange("p1", "2026-01-01", "2026-12-31")
    ).toHaveLength(0);
    expect(
      await repo.getByProfileAndDateRange("p2", "2026-01-01", "2026-12-31")
    ).toHaveLength(1);
  });

  it("multi-week persistence — sync of W2 does not affect W1 rows", async () => {
    const repo = createDexieCoachingRepository(db);
    await repo.upsertMany([makeRecord({ date: "2026-04-06", sourceId: "w1" })]);
    await repo.upsertMany([makeRecord({ date: "2026-04-13", sourceId: "w2" })]);

    const w1 = await repo.getByProfileAndDateRange(
      "p1",
      "2026-04-06",
      "2026-04-12"
    );
    const w2 = await repo.getByProfileAndDateRange(
      "p1",
      "2026-04-13",
      "2026-04-19"
    );
    expect(w1).toHaveLength(1);
    expect(w2).toHaveLength(1);
  });
});
