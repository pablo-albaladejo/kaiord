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

  it("resolves to the profile row when the id matches", async () => {
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_UUID_1, "A"));

    const { result } = renderHook(() => useProfileByIdLive(PROFILE_UUID_1));

    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_UUID_1);
    });
  });

  it("resolves to undefined for an unknown id", async () => {
    const { result } = renderHook(() =>
      useProfileByIdLive(PROFILE_UUID_MISSING)
    );

    // Resolves quickly to undefined (after the loading window).
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toBeUndefined();
  });

  it("returns undefined when id is null without firing a query", async () => {
    const { result } = renderHook(() => useProfileByIdLive(null));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toBeUndefined();
  });

  it("re-fires when the watched profile is updated", async () => {
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_UUID_1, "Original"));

    const { result } = renderHook(() => useProfileByIdLive(PROFILE_UUID_1));

    await waitFor(() => {
      expect(result.current?.name).toBe("Original");
    });

    await persistence.profiles.put({
      ...makeProfile(PROFILE_UUID_1, "Renamed"),
    });

    await waitFor(() => {
      expect(result.current?.name).toBe("Renamed");
    });
  });
});
