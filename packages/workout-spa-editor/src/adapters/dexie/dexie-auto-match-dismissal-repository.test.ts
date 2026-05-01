import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { AutoMatchDismissal } from "../../types/auto-match-dismissal";
import { KaiordDatabase } from "./dexie-database";
import { createDexieAutoMatchDismissalRepository } from "./dexie-auto-match-dismissal-repository";

const baseRow = (
  overrides: Partial<AutoMatchDismissal> = {}
): AutoMatchDismissal => ({
  profileId: "p1",
  weekStart: "2026-04-27",
  dismissedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("DexieAutoMatchDismissalRepository", () => {
  let db: KaiordDatabase;

  beforeEach(() => {
    db = new KaiordDatabase(
      `kaiord-dismiss-test-${Date.now()}-${Math.random()}`
    );
  });

  it("get returns undefined when no row exists", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toBeUndefined();
  });

  it("put-and-get round trip", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    const row = baseRow();

    await repo.put(row);

    expect(await repo.getByProfileAndWeek("p1", "2026-04-27")).toEqual(row);
  });

  it("put is upsert by composite (profileId, weekStart)", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);
    await repo.put(baseRow({ dismissedAt: "2026-05-01T10:00:00.000Z" }));

    await repo.put(baseRow({ dismissedAt: "2026-05-01T15:00:00.000Z" }));

    expect(
      (await repo.getByProfileAndWeek("p1", "2026-04-27"))?.dismissedAt
    ).toBe("2026-05-01T15:00:00.000Z");
  });

  it("delete is idempotent on missing rows", async () => {
    const repo = createDexieAutoMatchDismissalRepository(db);

    await expect(repo.delete("never", "2026-04-27")).resolves.toBeUndefined();
  });

  it("delete removes only the matching row", async () => {
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
