/**
 * Co-located test for `useProfileByIdLive`.
 *
 * Production Dexie + fake-indexeddb (D5.1). Covers loading state,
 * resolved row, missing-id null branch, and re-fire on write.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { Profile } from "../types/profile";
import { useProfileByIdLive } from "./use-profile-by-id-live";

const PROFILE_UUID_1 = "00000000-0000-4000-8000-0000000000b1";
const PROFILE_UUID_MISSING = "00000000-0000-4000-8000-0000000000b9";
const SETTLE_DELAY_MS = 50;

const makeProfile = (id: string, name: string): Profile => ({
  id,
  name,
  sportZones: {},
  createdAt: "2026-04-29T00:00:00Z",
  updatedAt: "2026-04-29T00:00:00Z",
});

const clear = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

describe("useProfileByIdLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the profile row when the id matches", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_UUID_1, "A"));

    // Act
    const { result } = renderHook(() => useProfileByIdLive(PROFILE_UUID_1));

    // Assert
    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_UUID_1);
    });
  });

  it("should resolve to undefined for an unknown id", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useProfileByIdLive(PROFILE_UUID_MISSING)
    );

    // Act
    await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY_MS));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should return undefined when id is null without firing a query", async () => {
    // Arrange
    const { result } = renderHook(() => useProfileByIdLive(null));

    // Act
    await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY_MS));

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should re-fire when the watched profile is updated", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_UUID_1, "Original"));
    const { result } = renderHook(() => useProfileByIdLive(PROFILE_UUID_1));
    await waitFor(() => {
      expect(result.current?.name).toBe("Original");
    });

    // Act
    await persistence.profiles.put({
      ...makeProfile(PROFILE_UUID_1, "Renamed"),
    });

    // Assert
    await waitFor(() => {
      expect(result.current?.name).toBe("Renamed");
    });
  });
});
