/**
 * deleteProfileWithCascade — application use case tests.
 */

import { describe, expect, it } from "vitest";

import { createInMemoryAiModelBindingRepository } from "../../test-utils/in-memory-ai-model-binding-repository";
import { createInMemoryAutoMatchDismissalRepository } from "../../test-utils/in-memory-auto-match-dismissal-repository";
import { createInMemoryChatConversationRepository } from "../../test-utils/in-memory-chat-conversation-repository";
import { createInMemoryChatMessageRepository } from "../../test-utils/in-memory-chat-message-repository";
import { createInMemoryCoachingDayNotesRepository } from "../../test-utils/in-memory-coaching-day-notes-repository";
import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "../../test-utils/in-memory-coaching-sync-state-repository";
import { createInMemoryConnectionRepository } from "../../test-utils/in-memory-connection-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import { createInMemoryUserPreferencesRepository } from "../../test-utils/in-memory-user-preferences-repository";
import { createInMemoryWorkoutRepository } from "../../test-utils/in-memory-workout-repository";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import type { DeleteProfileWithCascadeDeps } from "./delete-profile-with-cascade";
import { deleteProfileWithCascade } from "./delete-profile-with-cascade";

const NOW = "2026-04-28T10:00:00.000Z";

const makeWorkout = (id: string, profileId: string = "p1"): WorkoutRecord => ({
  id,
  profileId,
  date: "2026-04-13",
  sport: "cycling",
  source: "train2go",
  sourceId: `p1:${id}`,
  planId: null,
  state: "raw",
  raw: null,
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: NOW,
  modifiedAt: null,
  updatedAt: NOW,
});

const makeRecord = (
  profileId: string,
  sourceId: string
): CoachingActivityRecord => ({
  id: buildCoachingActivityId(profileId, "train2go", sourceId),
  profileId,
  source: "train2go",
  sourceId,
  date: "2026-04-13",
  sport: "cycling",
  title: "Test",
  status: "pending",
  fetchedAt: NOW,
});

const makeDeps = (
  overrides: Partial<DeleteProfileWithCascadeDeps> = {}
): DeleteProfileWithCascadeDeps => ({
  workouts: overrides.workouts ?? createInMemoryWorkoutRepository(),
  coaching: overrides.coaching ?? createInMemoryCoachingRepository(),
  coachingDayNotes:
    overrides.coachingDayNotes ?? createInMemoryCoachingDayNotesRepository(),
  coachingSyncState:
    overrides.coachingSyncState ?? createInMemoryCoachingSyncStateRepository(),
  sessionMatch:
    overrides.sessionMatch ?? createInMemorySessionMatchRepository(),
  autoMatchDismissal:
    overrides.autoMatchDismissal ??
    createInMemoryAutoMatchDismissalRepository(),
  userPreferences:
    overrides.userPreferences ?? createInMemoryUserPreferencesRepository(),
  healthCleanup: overrides.healthCleanup ?? {
    // No in-memory health data exists yet; the cascade still calls
    // this so the future per-metric repositories pick it up.
    deleteByProfile: async () => undefined,
  },
  chatMessages: overrides.chatMessages ?? createInMemoryChatMessageRepository(),
  chatConversations:
    overrides.chatConversations ?? createInMemoryChatConversationRepository(),
  aiModelBindings:
    overrides.aiModelBindings ?? createInMemoryAiModelBindingRepository(),
  connections: overrides.connections ?? createInMemoryConnectionRepository(),
});

describe("deleteProfileWithCascade", () => {
  it("should remove only the targeted profile's coaching activities", async () => {
    // Arrange
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coaching.upsertMany([
      makeRecord("p1", "1"),
      makeRecord("p1", "2"),
      makeRecord("p2", "3"),
    ]);

    // Act
    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p1"
    );

    // Assert
    expect(
      await coaching.getByProfileAndDateRange("p1", "2026-01-01", "2026-12-31")
    ).toHaveLength(0);
    expect(
      await coaching.getByProfileAndDateRange("p2", "2026-01-01", "2026-12-31")
    ).toHaveLength(1);
  });

  it("should remove only the targeted profile's coachingSyncState rows", async () => {
    // Arrange
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coachingSyncState.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: NOW,
    });
    await coachingSyncState.put({
      source: "train2go",
      profileId: "p2",
      lastSyncedAt: NOW,
    });

    // Act
    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p1"
    );

    // Assert
    expect(
      await coachingSyncState.getBySourceAndProfile("train2go", "p1")
    ).toBeUndefined();
    expect(
      await coachingSyncState.getBySourceAndProfile("train2go", "p2")
    ).toBeDefined();
  });

  it("should cascade delete the deleted profile's workouts and preserve other profiles' workouts", async () => {
    // Arrange
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    const workouts = createInMemoryWorkoutRepository();
    await workouts.put(makeWorkout("w1", "p1"));
    await workouts.put(makeWorkout("w2", "p2"));
    await coaching.upsertMany([makeRecord("p1", "1")]);

    // Act
    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState, workouts }),
      "p1"
    );

    // Assert
    expect(
      await coaching.getByProfileAndDateRange("p1", "2026-01-01", "2026-12-31")
    ).toHaveLength(0);
    expect(await workouts.getById("w1")).toBeUndefined();
    expect(await workouts.getById("w2")).toBeDefined();
  });

  it("should use the supplied id (NOT getActiveId)", async () => {
    // Arrange
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coaching.upsertMany([makeRecord("p-explicit", "1")]);

    // Act
    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p-explicit"
    );

    // Assert
    expect(
      await coaching.getByProfileAndDateRange(
        "p-explicit",
        "2026-01-01",
        "2026-12-31"
      )
    ).toHaveLength(0);
  });

  it("should cascade sessionMatch.deleteByProfile", async () => {
    // Arrange
    const deps = makeDeps();
    await deps.sessionMatch.put({
      id: "m1",
      profileId: "p1",
      coachingActivityId: "a1",
      workoutId: "w1",
      date: "2026-04-13",
      createdAt: NOW,
      source: "manual",
    });
    await deps.sessionMatch.put({
      id: "m2",
      profileId: "p2",
      coachingActivityId: "a2",
      workoutId: "w2",
      date: "2026-04-13",
      createdAt: NOW,
      source: "manual",
    });

    // Act
    await deleteProfileWithCascade(deps, "p1");

    // Assert
    expect(
      await deps.sessionMatch.listByProfileAndWeek(
        "p1",
        "2026-04-13",
        "2026-04-19"
      )
    ).toHaveLength(0);
    expect(
      await deps.sessionMatch.listByProfileAndWeek(
        "p2",
        "2026-04-13",
        "2026-04-19"
      )
    ).toHaveLength(1);
  });

  it("should cascade autoMatchDismissal.deleteByProfile", async () => {
    // Arrange
    const deps = makeDeps();
    await deps.autoMatchDismissal.put({
      profileId: "p1",
      weekStart: "2026-04-13",
      dismissedPairs: [{ activityId: "a1", workoutId: "w1", dismissedAt: NOW }],
    });
    await deps.autoMatchDismissal.put({
      profileId: "p2",
      weekStart: "2026-04-13",
      dismissedPairs: [{ activityId: "a2", workoutId: "w2", dismissedAt: NOW }],
    });

    // Act
    await deleteProfileWithCascade(deps, "p1");

    // Assert
    expect(
      await deps.autoMatchDismissal.getByProfileAndWeek("p1", "2026-04-13")
    ).toBeUndefined();
    expect(
      await deps.autoMatchDismissal.getByProfileAndWeek("p2", "2026-04-13")
    ).toBeDefined();
  });

  it("should cascade coachingDayNotes.deleteByProfile", async () => {
    // Arrange
    const coachingDayNotes = createInMemoryCoachingDayNotesRepository();
    await coachingDayNotes.upsert({
      id: "p1:train2go:2026-04-13",
      profileId: "p1",
      source: "train2go",
      date: "2026-04-13",
      comments: [],
      fetchedAt: NOW,
    });
    await coachingDayNotes.upsert({
      id: "p2:train2go:2026-04-13",
      profileId: "p2",
      source: "train2go",
      date: "2026-04-13",
      comments: [],
      fetchedAt: NOW,
    });

    // Act
    await deleteProfileWithCascade(makeDeps({ coachingDayNotes }), "p1");

    // Assert
    expect(
      await coachingDayNotes.getByDate("p1", "train2go", "2026-04-13")
    ).toBeUndefined();
    expect(
      await coachingDayNotes.getByDate("p2", "train2go", "2026-04-13")
    ).toBeDefined();
  });

  it("should cascade userPreferences.delete", async () => {
    // Arrange
    const deps = makeDeps();
    await deps.userPreferences.put({
      profileId: "p1",
      calendarView: "grid",
      updatedAt: NOW,
    });
    await deps.userPreferences.put({
      profileId: "p2",
      calendarView: "list",
      updatedAt: NOW,
    });

    // Act
    await deleteProfileWithCascade(deps, "p1");

    // Assert
    expect(await deps.userPreferences.get("p1")).toBeUndefined();
    expect(await deps.userPreferences.get("p2")).toBeDefined();
  });
});
