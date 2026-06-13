import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryCoachingDayNotesRepository } from "../../test-utils/in-memory-coaching-day-notes-repository";
import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { CoachingDayComment } from "../../types/coaching-day-notes-record";
import type { Profile } from "../../types/profile";
import type { CoachingTransport } from "./coaching-transport-port";
import { expandDay } from "./expand-day";

const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const profile = (links: LinkedCoachingAccount[] = []): Profile => ({
  id: "p1",
  name: "Pablo",
  sportZones: {},
  linkedAccounts: links,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const transport = (
  overrides: Partial<CoachingTransport> = {}
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(async () => ({ activities: [] })),
  ...overrides,
});

const COMMENTS: CoachingDayComment[] = [
  {
    author: "Daniel",
    isOwn: false,
    timestamp: "2026-04-13 09:00:00",
    text: "Buen entreno",
  },
];

describe("expandDay", () => {
  let deps: Parameters<typeof expandDay>[0];
  beforeEach(async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(profile([T2G_LINK]));
    deps = {
      profiles,
      coaching: createInMemoryCoachingRepository(),
      coachingDayNotes: createInMemoryCoachingDayNotesRepository(),
      transport: transport(),
    };
  });

  it("should return not-linked when the profile has no link for the source", async () => {
    // Arrange
    await deps.profiles.put(profile([]));

    // Act
    const result = await expandDay(deps, "p1", "2026-04-13");

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-linked" });
  });

  it("should return not-linked when profile is missing", async () => {
    // Arrange
    const empty = createInMemoryProfileRepository();
    deps = { ...deps, profiles: empty };

    // Act
    const result = await expandDay(deps, "missing", "2026-04-13");

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-linked" });
  });

  it("should surface session-expired distinctly from transport errors", async () => {
    // Arrange
    const t = transport({
      readDay: vi.fn(async () => {
        throw new Error("Session expired");
      }),
    });
    deps = { ...deps, transport: t };

    // Act
    const result = await expandDay(deps, "p1", "2026-04-13");

    // Assert
    expect(result).toEqual({ ok: false, reason: "session-expired" });
  });

  it("should return transport-error for generic transport rejections", async () => {
    // Arrange
    const t = transport({
      readDay: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    deps = { ...deps, transport: t };

    // Act
    const result = await expandDay(deps, "p1", "2026-04-13");

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "network down",
    });
  });

  it("should persist the day comment thread returned by readDay", async () => {
    // Arrange
    const t = transport({
      readDay: vi.fn(async () => ({ activities: [], comments: COMMENTS })),
    });
    deps = { ...deps, transport: t };

    // Act
    await expandDay(deps, "p1", "2026-04-13");

    // Assert
    const notes = await deps.coachingDayNotes.getByDate(
      "p1",
      "train2go",
      "2026-04-13"
    );
    expect(notes?.comments).toEqual(COMMENTS);
  });

  it("should replace the stored thread wholesale on re-fetch", async () => {
    // Arrange
    await deps.coachingDayNotes.upsert({
      id: "p1:train2go:2026-04-13",
      profileId: "p1",
      source: "train2go",
      date: "2026-04-13",
      comments: COMMENTS,
      fetchedAt: "2026-04-13T08:00:00.000Z",
    });
    const t = transport({
      readDay: vi.fn(async () => ({ activities: [], comments: [] })),
    });
    deps = { ...deps, transport: t };

    // Act
    await expandDay(deps, "p1", "2026-04-13");

    // Assert
    const notes = await deps.coachingDayNotes.getByDate(
      "p1",
      "train2go",
      "2026-04-13"
    );
    expect(notes?.comments).toEqual([]);
  });

  it("should leave local notes untouched when readDay omits comments", async () => {
    // Arrange
    await deps.coachingDayNotes.upsert({
      id: "p1:train2go:2026-04-13",
      profileId: "p1",
      source: "train2go",
      date: "2026-04-13",
      comments: COMMENTS,
      fetchedAt: "2026-04-13T08:00:00.000Z",
    });
    const t = transport({
      readDay: vi.fn(async () => ({ activities: [] })),
    });
    deps = { ...deps, transport: t };

    // Act
    await expandDay(deps, "p1", "2026-04-13");

    // Assert
    const notes = await deps.coachingDayNotes.getByDate(
      "p1",
      "train2go",
      "2026-04-13"
    );
    expect(notes?.comments).toEqual(COMMENTS);
  });

  it("should still upsert activities when day-notes persistence throws", async () => {
    // Arrange
    const coaching = createInMemoryCoachingRepository();
    const throwingNotes = {
      getByDate: async () => undefined,
      upsert: async () => {
        throw new Error("notes write failed");
      },
      deleteByProfile: async () => undefined,
    };
    const t = transport({
      readDay: vi.fn(async () => ({
        activities: [
          {
            id: "p1:train2go:Z",
            profileId: "p1",
            source: "train2go",
            sourceId: "Z",
            date: "2026-04-13",
            sport: "cycling",
            title: "Intervals",
            status: "pending" as const,
            description: "desc",
            fetchedAt: "2026-04-13T08:00:00.000Z",
          },
        ],
        comments: COMMENTS,
      })),
    });
    deps = { ...deps, coaching, coachingDayNotes: throwingNotes, transport: t };

    // Act
    const result = await expandDay(deps, "p1", "2026-04-13");

    // Assert
    expect(result).toEqual({ ok: true, activityCount: 1 });
    const stored = await coaching.getById("p1:train2go:Z");
    expect(stored?.description).toBe("desc");
  });
});
