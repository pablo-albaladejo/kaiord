import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { AutoMatchDismissal } from "../../types/auto-match-dismissal";
import { createDexieAutoMatchDismissalRepository } from "./dexie-auto-match-dismissal-repository";
import { KaiordDatabase } from "./dexie-database";

const baseRow = (
  overrides: Partial<AutoMatchDismissal> = {}
): AutoMatchDismissal => ({
  profileId: "p1",
  weekStart: "2026-04-27",
  dismissedPairs: [
    {
      activityId: "a1",
      workoutId: "w1",
      dismissedAt: "2026-05-01T12:00:00.000Z",
    },
  ],
  ...overrides,
});

describe("DexieAutoMatchDismissalRepository", () => {
  let db: KaiordDatabase;

  beforeEach(() => {
    db = new KaiordDatabase(
      `kaiord-dismiss-test-${Date.now()}-${Math.random()}`
    );
  });

  it("should return undefined from get when no row exists", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toBeUndefined();
  });

  it("should round-trip via put-and-get", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    const row = baseRow();

    await repo.put(row);

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toEqual(row);
  });

  it("should upsert via put by composite (profileId, weekStart)", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    await repo.put(
      baseRow({
        dismissedPairs: [
          {
            activityId: "a1",
            workoutId: "w1",
            dismissedAt: "2026-05-01T10:00:00.000Z",
          },
        ],
      })
    );

    await repo.put(
      baseRow({
        dismissedPairs: [
          {
            activityId: "a1",
            workoutId: "w1",
            dismissedAt: "2026-05-01T15:00:00.000Z",
          },
        ],
      })
    );

    expect(
      (await repo.getByProfileAndWeek("p1", "2026-04-27"))?.dismissedPairs[0]
        ?.dismissedAt
    ).toBe("2026-05-01T15:00:00.000Z");
  });

  it("should be idempotent on delete when rows are missing", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);

    await expect(repo.delete("never", "2026-04-27")).resolves.toBeUndefined();
  });

  it("should remove only the matching row on delete", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    await repo.put(baseRow({ weekStart: "2026-04-27" }));
    await repo.put(baseRow({ weekStart: "2026-05-04" }));

    await repo.delete("p1", "2026-04-27");

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toBeUndefined();
    expect(await repo.getByProfileAndWeek("p1", "2026-05-04")).toBeDefined();
  });

  it("deleteByProfile removes only that profile's rows", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    await repo.put(baseRow({ profileId: "p1", weekStart: "2026-04-27" }));
    await repo.put(baseRow({ profileId: "p1", weekStart: "2026-05-04" }));
    await repo.put(baseRow({ profileId: "p2", weekStart: "2026-04-27" }));

    await repo.deleteByProfile("p1");

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toBeUndefined();
    expect(await repo.getByProfileAndWeek("p1", "2026-05-04")).toBeUndefined();
    expect(await repo.getByProfileAndWeek("p2", "2026-04-27")).toBeDefined();
  });
});
