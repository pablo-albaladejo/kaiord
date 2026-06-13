/**
 * Tests for the day-comments live-query hook: composite-key lookup,
 * empty defaults, and reactivity when the stored thread changes.
 */
import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import type { CoachingDayNotesRecord } from "../../../types/coaching-day-notes-record";
import { useCoachingDayComments } from "./use-coaching-day-comments";

const record = (
  over: Partial<CoachingDayNotesRecord> = {}
): CoachingDayNotesRecord => ({
  id: "p1:train2go:2026-06-07",
  profileId: "p1",
  source: "train2go",
  date: "2026-06-07",
  comments: [
    {
      author: "Coach",
      isOwn: false,
      timestamp: "2026-06-07 22:55",
      text: "hi",
    },
  ],
  fetchedAt: "2026-06-12T10:00:00.000Z",
  ...over,
});

describe("useCoachingDayComments", () => {
  beforeEach(async () => {
    await db.table("coachingDayNotes").clear();
  });

  it("should return the stored thread for the profile/source/date key", async () => {
    // Arrange
    await db.table("coachingDayNotes").put(record());

    // Act
    const { result } = renderHook(() =>
      useCoachingDayComments("p1", "train2go", "2026-06-07")
    );

    // Assert
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0]?.text).toBe("hi");
  });

  it("should return an empty array when no thread is stored", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() =>
      useCoachingDayComments("p1", "train2go", "2026-06-09")
    );

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should return an empty array when there is no active profile", async () => {
    // Arrange
    await db.table("coachingDayNotes").put(record());

    // Act
    const { result } = renderHook(() =>
      useCoachingDayComments(null, "train2go", "2026-06-07")
    );

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should reflect a wholesale-replaced thread reactively", async () => {
    // Arrange
    await db.table("coachingDayNotes").put(record());
    const { result } = renderHook(() =>
      useCoachingDayComments("p1", "train2go", "2026-06-07")
    );
    await waitFor(() => expect(result.current).toHaveLength(1));

    // Act
    await db.table("coachingDayNotes").put(
      record({
        comments: [
          { author: "A", isOwn: true, timestamp: "t1", text: "one" },
          { author: "B", isOwn: false, timestamp: "t2", text: "two" },
        ],
      })
    );

    // Assert
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current.map((c) => c.text)).toEqual(["one", "two"]);
  });
});
