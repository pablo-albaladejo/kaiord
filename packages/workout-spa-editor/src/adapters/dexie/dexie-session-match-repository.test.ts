import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { SessionMatch } from "../../types/session-match";
import { SessionAlreadyMatchedError } from "../../types/session-match-errors";
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
  executedWorkoutIds: overrides.executedWorkoutIds ?? [],
});

describe("DexieSessionMatchRepository", () => {
  let db: KaiordDatabase;

  beforeEach(() => {
    db = new KaiordDatabase(`kaiord-match-test-${Date.now()}-${Math.random()}`);
  });

  it("should round-trip via put-and-get on getByActivityId", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    const m = makeMatch();

    // Act
    await repo.put(m);

    // Assert
    expect(await repo.getByActivityId("p1", m.coachingActivityId)).toEqual(m);
  });

  it("should round-trip via put-and-get on getByWorkoutId", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    const m = makeMatch();

    // Act
    await repo.put(m);

    // Assert
    expect(await repo.getByWorkoutId("p1", m.workoutId)).toEqual(m);
  });

  it("should reject double-match on activity side with SessionAlreadyMatchedError", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);

    // Act
    await repo.put(makeMatch({ id: "M1" }));

    // Assert
    await expect(
      repo.put(makeMatch({ id: "M2", workoutId: "w-other" }))
    ).rejects.toBeInstanceOf(SessionAlreadyMatchedError);
  });

  it("should reject double-match on workout side", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);

    // Act
    await repo.put(makeMatch({ id: "M1" }));

    // Assert
    await expect(
      repo.put(
        makeMatch({
          id: "M2",
          coachingActivityId: "p1:train2go:other",
        })
      )
    ).rejects.toBeInstanceOf(SessionAlreadyMatchedError);
  });

  it("should permit same workout matched in different profiles", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);

    // Act
    await repo.put(
      makeMatch({
        id: "M1",
        profileId: "p1",
        coachingActivityId: "p1:train2go:1",
        workoutId: "w-shared",
      })
    );

    // Assert
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

  it("should be idempotent on upsert by id (re-put same id replaces, no uniqueness error)", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);

    // Act
    await repo.put(makeMatch({ id: "M1", source: "manual" }));

    // Assert
    await expect(
      repo.put(makeMatch({ id: "M1", source: "auto-suggestion" }))
    ).resolves.toBeUndefined();
    expect(
      (await repo.getByActivityId("p1", "p1:train2go:12345"))?.source
    ).toBe("auto-suggestion");
  });

  it("should list inclusive and profile-scoped via listByProfileAndWeek", async () => {
    // Arrange
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

    // Act
    const result = await repo.listByProfileAndWeek(
      "p1",
      "2026-04-27",
      "2026-05-03"
    );

    // Assert
    expect(result.map((m) => m.id).sort()).toEqual(["M1", "M2"]);
  });

  it("should be a no-op on delete when missing", async () => {
    // Arrange

    // Act
    const repo = createDexieSessionMatchRepository(db);

    // Assert
    await expect(repo.delete("never")).resolves.toBeUndefined();
  });

  it("should remove the row on delete by id", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));

    // Act
    await repo.delete("M1");

    // Assert
    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
  });

  it("should remove only matching rows via deleteByActivityId, idempotent on miss", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1" }));
    await repo.put(
      makeMatch({
        id: "M2",
        coachingActivityId: "p1:train2go:keep",
        workoutId: "w-keep",
      })
    );

    // Act
    await repo.deleteByActivityId("p1:train2go:12345");

    // Assert
    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
    expect((await repo.getByActivityId("p1", "p1:train2go:keep"))?.id).toBe(
      "M2"
    );
    await expect(repo.deleteByActivityId("never")).resolves.toBeUndefined();
  });

  it("should remove only matching rows via deleteByWorkoutId, idempotent on miss", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", workoutId: "w-drop" }));
    await repo.put(
      makeMatch({
        id: "M2",
        coachingActivityId: "p1:train2go:keep",
        workoutId: "w-keep",
      })
    );

    // Act
    await repo.deleteByWorkoutId("w-drop");

    // Assert
    expect(await repo.getByWorkoutId("p1", "w-drop")).toBeUndefined();
    expect((await repo.getByWorkoutId("p1", "w-keep"))?.id).toBe("M2");
    await expect(repo.deleteByWorkoutId("never")).resolves.toBeUndefined();
  });

  it("should set-union append into executedWorkoutIds idempotently", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", executedWorkoutIds: ["w-a"] }));

    // Act
    await repo.appendExecutedWorkoutIds("M1", ["w-a", "w-b", "w-c"]);

    // Assert
    expect((await repo.getById("M1"))?.executedWorkoutIds.sort()).toEqual([
      "w-a",
      "w-b",
      "w-c",
    ]);
  });

  it("should be a no-op when matchId is missing (concurrent-delete tolerance)", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);

    // Act

    // Assert
    await expect(
      repo.appendExecutedWorkoutIds("never", ["w-x"])
    ).resolves.toBeUndefined();
  });

  it("should be a no-op when workoutIds is empty", async () => {
    // Arrange
    const repo = createDexieSessionMatchRepository(db);
    await repo.put(makeMatch({ id: "M1", executedWorkoutIds: ["w-a"] }));

    // Act
    await repo.appendExecutedWorkoutIds("M1", []);

    // Assert
    expect((await repo.getById("M1"))?.executedWorkoutIds).toEqual(["w-a"]);
  });

  it("should remove only that profile's rows when deleteByProfile is called", async () => {
    // Arrange
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

    // Act
    await repo.deleteByProfile("p1");

    // Assert
    expect(
      await repo.getByActivityId("p1", "p1:train2go:12345")
    ).toBeUndefined();
    expect((await repo.getByActivityId("p2", "p2:train2go:1"))?.id).toBe("M2");
  });
});
