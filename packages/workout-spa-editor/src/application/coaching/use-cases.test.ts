/**
 * Application-layer use cases — unit tests with in-memory repos.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "../../test-utils/in-memory-coaching-sync-state-repository";
import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import { createInMemoryWorkoutRepository } from "../../test-utils/in-memory-workout-repository";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import type { Profile } from "../../types/profile";
import { ProfileNotFoundError } from "../profile/errors";
import { attemptLink } from "./attempt-link";
import type {
  CoachingPingResult,
  CoachingTransport,
} from "./coaching-transport-port";
import { convertCoachingActivity } from "./convert-coaching-activity";
import { expandDay } from "./expand-day";
import { linkAccount } from "./link-account";
import { syncWeek } from "./sync-week";
import { unlinkAccount } from "./unlink-account";

const NOW = "2026-04-28T10:00:00.000Z";
const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: NOW,
};

const makeProfile = (
  id: string,
  links: LinkedCoachingAccount[] = []
): Profile => ({
  id,
  name: `Profile ${id}`,
  sportZones: {},
  linkedAccounts: links,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

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
    fetchedAt: NOW,
    ...overrides,
  };
};

const makeTransport = (
  overrides: Partial<CoachingTransport> = {}
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(async () => ({
    sessionActive: false,
    externalUserId: null,
    externalUserName: null,
  })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => []),
  ...overrides,
});

describe("linkAccount", () => {
  it("writes to the supplied profileId (NOT getActiveId)", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A"));
    await profiles.put(makeProfile("B"));
    await profiles.setActiveId("B");

    await linkAccount(profiles, "A", T2G_LINK);

    const a = await profiles.getById("A");
    const b = await profiles.getById("B");
    expect(a?.linkedAccounts).toEqual([T2G_LINK]);
    expect(b?.linkedAccounts).toEqual([]);
  });

  it("throws ProfileNotFoundError when the profile was deleted", async () => {
    const profiles = createInMemoryProfileRepository();

    await expect(
      linkAccount(profiles, "missing", T2G_LINK)
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});

describe("unlinkAccount", () => {
  it("is a silent no-op when the profile no longer exists", async () => {
    const profiles = createInMemoryProfileRepository();

    await expect(
      unlinkAccount(profiles, "missing", "train2go")
    ).resolves.toBeUndefined();
  });

  it("is a silent no-op when the source is not linked", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A"));

    await expect(
      unlinkAccount(profiles, "A", "train2go")
    ).resolves.toBeUndefined();

    const a = await profiles.getById("A");
    expect(a?.linkedAccounts).toEqual([]);
  });

  it("removes a linked account when present", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A", [T2G_LINK]));

    await unlinkAccount(profiles, "A", "train2go");

    const a = await profiles.getById("A");
    expect(a?.linkedAccounts).toEqual([]);
  });

  it("does NOT cascade to coachingActivities (disconnect retains historical activities)", async () => {
    // Spec: "Persisted coachingActivities rows for that profile remain on disk;
    // only profile deletion fully purges them."
    const profiles = createInMemoryProfileRepository();
    const coaching = createInMemoryCoachingRepository();
    await profiles.put(makeProfile("A", [T2G_LINK]));
    await coaching.upsertMany([makeRecord({ profileId: "A" })]);

    await unlinkAccount(profiles, "A", "train2go");

    // Profile no longer linked
    const a = await profiles.getById("A");
    expect(a?.linkedAccounts).toEqual([]);

    // Coaching activities untouched — unlinkAccount has no coaching repo access
    const activities = await coaching.getByProfileAndDateRange(
      "A",
      "2026-01-01",
      "2026-12-31"
    );
    expect(activities).toHaveLength(1);
  });
});

describe("syncWeek", () => {
  let deps: Parameters<typeof syncWeek>[0];

  beforeEach(async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1", [T2G_LINK]));
    deps = {
      profiles,
      coaching: createInMemoryCoachingRepository(),
      coachingSyncState: createInMemoryCoachingSyncStateRepository(),
      transport: makeTransport(),
      now: () => NOW,
    };
  });

  it("errors when the profile has no link for the source", async () => {
    await deps.profiles.put(makeProfile("p2"));

    const result = await syncWeek(deps, "p2", "2026-04-13");

    expect(result).toEqual({ ok: false, reason: "not-linked" });
  });

  it("upserts fetched activities and updates lastSyncedAt", async () => {
    const t = makeTransport({
      readWeek: vi.fn(async () => [makeRecord({ sourceId: "1" })]),
    });
    deps = { ...deps, transport: t };

    const result = await syncWeek(deps, "p1", "2026-04-13");

    expect(result).toEqual({ ok: true, activityCount: 1, orphansDeleted: 0 });
    const stored = await deps.coaching.getByProfileAndDateRange(
      "p1",
      "2026-04-13",
      "2026-04-19"
    );
    expect(stored).toHaveLength(1);
    const sync = await deps.coachingSyncState.getBySourceAndProfile(
      "train2go",
      "p1"
    );
    expect(sync?.lastSyncedAt).toBe(NOW);
  });

  it("updates lastSyncedAt UNCONDITIONALLY on zero-activity responses", async () => {
    const result = await syncWeek(deps, "p1", "2026-04-13");

    expect(result).toEqual({ ok: true, activityCount: 0, orphansDeleted: 0 });
    const sync = await deps.coachingSyncState.getBySourceAndProfile(
      "train2go",
      "p1"
    );
    expect(sync?.lastSyncedAt).toBe(NOW);
  });

  it("deletes orphans within the week but leaves other weeks untouched", async () => {
    await deps.coaching.upsertMany([
      makeRecord({ sourceId: "in-week-orphan", date: "2026-04-15" }),
      makeRecord({ sourceId: "other-week", date: "2026-04-22" }),
    ]);
    const t = makeTransport({
      readWeek: vi.fn(async () => [
        makeRecord({ sourceId: "kept", date: "2026-04-13" }),
      ]),
    });
    deps = { ...deps, transport: t };

    const result = await syncWeek(deps, "p1", "2026-04-13");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.orphansDeleted).toBe(1);
    const all = await deps.coaching.getByProfileAndDateRange(
      "p1",
      "2026-04-01",
      "2026-04-30"
    );
    const ids = all.map((r) => r.sourceId).sort();
    expect(ids).toEqual(["kept", "other-week"]);
  });

  it("surfaces session-expired distinctly from transport errors", async () => {
    const t = makeTransport({
      readWeek: vi.fn(async () => {
        throw new Error("Session expired");
      }),
    });
    deps = { ...deps, transport: t };

    const result = await syncWeek(deps, "p1", "2026-04-13");

    expect(result).toEqual({ ok: false, reason: "session-expired" });
  });
});

describe("expandDay", () => {
  it("upserts ALL activities returned by readDay (siblings included)", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1", [T2G_LINK]));
    const coaching = createInMemoryCoachingRepository();
    const t = makeTransport({
      readDay: vi.fn(async () => [
        makeRecord({ sourceId: "X", description: "X desc" }),
        makeRecord({ sourceId: "Y", description: "Y desc" }),
      ]),
    });

    const result = await expandDay(
      { profiles, coaching, transport: t },
      "p1",
      "2026-04-13"
    );

    expect(result).toEqual({ ok: true, activityCount: 2 });
    const x = await coaching.getById(
      buildCoachingActivityId("p1", "train2go", "X")
    );
    const y = await coaching.getById(
      buildCoachingActivityId("p1", "train2go", "Y")
    );
    expect(x?.description).toBe("X desc");
    expect(y?.description).toBe("Y desc");
  });

  it("does NOT update coachingSyncState.lastSyncedAt", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1", [T2G_LINK]));
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    const t = makeTransport({ readDay: vi.fn(async () => []) });

    await expandDay({ profiles, coaching, transport: t }, "p1", "2026-04-13");

    const sync = await coachingSyncState.getBySourceAndProfile(
      "train2go",
      "p1"
    );
    expect(sync).toBeUndefined();
  });
});

describe("convertCoachingActivity", () => {
  let deps: Parameters<typeof convertCoachingActivity>[0];
  beforeEach(() => {
    deps = {
      coaching: createInMemoryCoachingRepository(),
      workouts: createInMemoryWorkoutRepository(),
      newId: () => "wk-test-id",
      now: () => NOW,
    };
  });

  it("creates a raw workout on first conversion (within profile)", async () => {
    const activity = makeRecord({ profileId: "p1", sourceId: "12345" });
    await deps.coaching.put(activity);

    const result = await convertCoachingActivity(deps, activity.id);

    expect(result).toEqual({ workoutId: "wk-test-id", created: true });
    const w = await deps.workouts.getById("wk-test-id");
    expect(w?.state).toBe("raw");
    expect(w?.sourceId).toBe("p1:12345");
  });

  it("is idempotent within the same profile", async () => {
    const activity = makeRecord({ profileId: "p1" });
    await deps.coaching.put(activity);
    await convertCoachingActivity(deps, activity.id);

    const result = await convertCoachingActivity(deps, activity.id);

    expect(result.created).toBe(false);
    expect(result.workoutId).toBe("wk-test-id");
  });

  it("creates distinct workouts in different profiles for the same source activity", async () => {
    let counter = 0;
    deps = {
      ...deps,
      newId: () => `wk-${++counter}`,
    };
    const a1 = makeRecord({ profileId: "p1", sourceId: "12345" });
    const a2 = makeRecord({ profileId: "p2", sourceId: "12345" });
    await deps.coaching.put(a1);
    await deps.coaching.put(a2);

    const r1 = await convertCoachingActivity(deps, a1.id);
    const r2 = await convertCoachingActivity(deps, a2.id);

    expect(r1.workoutId).not.toBe(r2.workoutId);
    const w1 = await deps.workouts.getById(r1.workoutId);
    const w2 = await deps.workouts.getById(r2.workoutId);
    expect(w1?.sourceId).toBe("p1:12345");
    expect(w2?.sourceId).toBe("p2:12345");
  });

  it("preserves the coachingActivities row after a successful conversion", async () => {
    // The conversion creates a Workout (state: "raw"); the source coaching row
    // MUST remain on disk so re-conversion is idempotent and the user can
    // re-run the conversion or inspect history. This is locked in here so a
    // future refactor that "cleans up" by deleting the row gets caught.
    const activity = makeRecord({ profileId: "p1", sourceId: "12345" });
    await deps.coaching.put(activity);

    await convertCoachingActivity(deps, activity.id);

    const stillThere = await deps.coaching.getByProfileAndSourceId(
      "p1",
      "train2go",
      "12345"
    );
    expect(stillThere).toEqual(activity);
  });

  it("re-throws when WorkoutRepository.put rejects (so caller does not navigate)", async () => {
    const activity = makeRecord();
    await deps.coaching.put(activity);
    const failingWorkouts = createInMemoryWorkoutRepository();
    failingWorkouts.put = async () => {
      throw new Error("quota exceeded");
    };

    await expect(
      convertCoachingActivity(
        { ...deps, workouts: failingWorkouts },
        activity.id
      )
    ).rejects.toThrow("quota exceeded");
  });
});

describe("attemptLink", () => {
  const makeDeps = (
    overrides: Parameters<typeof attemptLink>[0] | object = {}
  ) => {
    const profiles = createInMemoryProfileRepository();
    return {
      profiles,
      transport: makeTransport(),
      now: () => NOW,
      delay: () => Promise.resolve(),
      pollIntervalMs: 1,
      maxAttempts: 3,
      ...overrides,
    } as Parameters<typeof attemptLink>[0];
  };

  it("aborts cleanly mid-poll without writing the link", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A"));
    const controller = new AbortController();
    const deps = makeDeps({ profiles });

    // Abort immediately so the very first poll iteration short-circuits
    controller.abort();

    const result = await attemptLink(deps, "A", controller.signal);

    expect(result).toEqual({ ok: false, reason: "aborted" });
    const a = await profiles.getById("A");
    expect(a?.linkedAccounts).toEqual([]);
  });

  it("returns aborted and writes nothing when the signal is aborted mid-poll", async () => {
    // Distinct from "aborts cleanly mid-poll without writing the link" above:
    // there, signal.aborted is already true on entry (early return). Here, the
    // call begins on a non-aborted signal, parks at the in-loop delay() await,
    // then the caller aborts (modeling a Disconnect click after Connect started).
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("p1"));
    const controller = new AbortController();
    let resolveDelay: (() => void) | null = null;
    const delay = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelay = resolve;
        })
    );
    const ping = vi.fn();
    const deps = makeDeps({
      profiles,
      transport: makeTransport({ ping }),
      delay,
    });

    const linkPromise = attemptLink(deps, "p1", controller.signal);
    // Flush microtasks until the function reaches the in-loop delay.
    while (!resolveDelay) await new Promise((r) => setTimeout(r, 0));
    controller.abort();
    (resolveDelay as unknown as () => void)();
    const result = await linkPromise;

    expect(result).toEqual({ ok: false, reason: "aborted" });
    expect(ping).not.toHaveBeenCalled();
    const a = await profiles.getById("p1");
    expect(a?.linkedAccounts).toEqual([]);
  });

  it("links to the captured target profile even if the active profile changed", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A"));
    await profiles.put(makeProfile("B"));
    await profiles.setActiveId("A");
    const ping = vi
      .fn<() => Promise<CoachingPingResult>>()
      .mockResolvedValueOnce({
        sessionActive: false,
        externalUserId: null,
        externalUserName: null,
      })
      .mockResolvedValueOnce({
        sessionActive: true,
        externalUserId: "28035",
        externalUserName: "Pablo",
      });
    const deps = makeDeps({
      profiles,
      transport: makeTransport({ ping }),
    });

    // Simulate active profile change AFTER click captured "A".
    await profiles.setActiveId("B");
    const result = await attemptLink(deps, "A");

    expect(result).toEqual({ ok: true });
    const a = await profiles.getById("A");
    const b = await profiles.getById("B");
    expect(a?.linkedAccounts).toHaveLength(1);
    expect(b?.linkedAccounts).toHaveLength(0);
  });

  it("returns profile-deleted when the target profile is gone at write time", async () => {
    const profiles = createInMemoryProfileRepository();
    const ping = vi.fn<() => Promise<CoachingPingResult>>().mockResolvedValue({
      sessionActive: true,
      externalUserId: "28035",
      externalUserName: "Pablo",
    });
    const deps = makeDeps({ profiles, transport: makeTransport({ ping }) });

    const result = await attemptLink(deps, "missing");

    expect(result).toEqual({ ok: false, reason: "profile-deleted" });
  });

  it("times out as session-not-active after maxAttempts pings without a session", async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(makeProfile("A"));
    const deps = makeDeps({ profiles });

    const result = await attemptLink(deps, "A");

    expect(result).toEqual({ ok: false, reason: "session-not-active" });
  });
});
