import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { SessionAlreadyMatchedError } from "../../types/session-match-errors";
import type { SessionMatch } from "../../types/session-match";
import { KaiordDatabase } from "./dexie-database";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";

const makeMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: overrides.id ?? "M1",
  profileId: overrides.profileId ?? "p1",
  coachingActivityId: overrides.coachingActivityId ?? "p1:train2go:12345",
  workoutId: overrides.workoutId ?? "w-abc",
  date: overrides.date ?? "2026-04-29",
  createdAt: overrides.createdAt ?? "2026-05-01T12:00:00.000Z",
  source: overrides.source ?? "manual",
});

describe("DexieSessionMatchRepository", () => {
  let db: KaiordDatabase;

  beforeEach(() => {
    db = new KaiordDatabase(`kaiord-match-test-${Date.now()}-${Math.random()}`);
  });

  it("put-and-get round trip via getByActivityId", async () => {
    const repo = createDexieSessionMatchRepository(db);
    const m = makeMatch();

    await repo.put(m);

    expect(await repo.getByActivityId("p1", m.coachingActivityId)).toEqual(m);
  });

  it("put-and-get round trip via getByWorkoutId", async () => {
    const repo = createDexieSessionMatchRepository(db);
    const m = makeMatch();

    await repo.put(m);

    expect(await repo.getByWorkoutId("p1", m.workoutId)).toEqual(m);
  });

  it("rejects double-match on activity side with SessionAlreadyMatchedError", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));

    await expect(
      repo.put(makeMatch({ id: "M2", workoutId: "w-other" }))
    ).rejects.toBeInstanceOf(SessionAlreadyMatchedError);
  });

  it("rejects double-match on workout side", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));

    await expect(
      repo.put(
        makeMatch({
          id: "M2",
          coachingActivityId: "p1:train2go:other",
        })
      )
    ).rejects.toBeInstanceOf(SessionAlreadyMatchedError);
  });

  it("permits same workout matched in different profiles", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(
      makeMatch({
        id: "M1",
        profileId: "p1",
        coachingActivityId: "p1:train2go:1",
        workoutId: "w-shared",
      })
    );

    await expect(
      repo.put(
        makeMatch({
          id: "M2",
          profileId: "p2",
          coachingActivityId: "p2:train2go:1",
          workoutId: "w-shared",
        })
      )
    ).resolves.toBeUndefined();

    expect((await repo.getByWorkoutId("p1", "w-shared"))?.profileId).toBe("p1");
    expect((await repo.getByWorkoutId("p2", "w-shared"))?.profileId).toBe("p2");
  });

  it("upsert by id is idempotent (re-put same id replaces, no uniqueness error)", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", source: "manual" }));

    await expect(
      repo.put(makeMatch({ id: "M1", source: "auto-suggestion" }))
    ).resolves.toBeUndefined();

    expect(
      (await repo.getByActivityId("p1", "p1:train2go:12345"))?.source
    ).toBe("auto-suggestion");
  });

  it("listByProfileAndWeek inclusive, profile-scoped", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", date: "2026-04-27" }));
    await repo.put(
      makeMatch({
        id: "M2",
        coachingActivityId: "p1:train2go:2",
        workoutId: "w-2",
        date: "2026-05-03",
      })
    );
    await repo.put(
      makeMatch({
        id: "M3",
        coachingActivityId: "p1:train2go:3",
        workoutId: "w-3",
        date: "2026-05-04",
      })
    );
    await repo.put(
      makeMatch({
        id: "M4",
        profileId: "p2",
        coachingActivityId: "p2:train2go:9",
        workoutId: "w-9",
        date: "2026-04-29",
      })
    );

    const result = await repo.listByProfileAndWeek(
      "p1",
      "2026-04-27",
      "2026-05-03"
    );

    expect(result.map((m) => m.id).sort()).toEqual(["M1", "M2"]);
  });

  it("delete is no-op on missing", async () => {
    const repo = createDexieSessionMatchRepository(db);

    await expect(repo.delete("never")).resolves.toBeUndefined();
  });

  it("delete by id removes the row", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));

    await repo.delete("M1");

    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
  });

  it("deleteByActivityId removes only matching rows, idempotent on miss", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));
    await repo.put(
      makeMatch({
        id: "M2",
        coachingActivityId: "p1:train2go:keep",
        workoutId: "w-keep",
      })
    );

    await repo.deleteByActivityId("p1:train2go:12345");

    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
    expect((await repo.getByActivityId("p1", "p1:train2go:keep"))?.id).toBe(
      "M2"
    );

    await expect(repo.deleteByActivityId("never")).resolves.toBeUndefined();
  });

  it("deleteByWorkoutId removes only matching rows, idempotent on miss", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", workoutId: "w-drop" }));
    await repo.put(
      makeMatch({
        id: "M2",
        coachingActivityId: "p1:train2go:keep",
        workoutId: "w-keep",
      })
    );

    await repo.deleteByWorkoutId("w-drop");

    expect(await repo.getByWorkoutId("p1", "w-drop")).toBeUndefined();
    expect((await repo.getByWorkoutId("p1", "w-keep"))?.id).toBe("M2");

    await expect(repo.deleteByWorkoutId("never")).resolves.toBeUndefined();
  });

  it("deleteByProfile removes only that profile's rows", async () => {
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", profileId: "p1" }));
    await repo.put(
      makeMatch({
        id: "M2",
        profileId: "p2",
        coachingActivityId: "p2:train2go:1",
        workoutId: "w-other",
      })
    );

    await repo.deleteByProfile("p1");

    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
    expect((await repo.getByActivityId("p2", "p2:train2go:1"))?.id).toBe("M2");
  });
});
