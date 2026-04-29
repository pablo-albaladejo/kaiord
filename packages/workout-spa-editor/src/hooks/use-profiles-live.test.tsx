/**
 * Co-located test for `useProfilesLive`.
 *
 * Verifies the live hook reads through the production Dexie singleton
 * (fake-indexeddb-backed in jsdom — D5.1) and re-fires when a write
 * lands via `PersistencePort.profiles.put`.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { Profile } from "../types/profile";
import { useProfilesLive } from "./use-profiles-live";

const PROFILE_UUID_1 = "00000000-0000-4000-8000-0000000000a1";
const PROFILE_UUID_2 = "00000000-0000-4000-8000-0000000000a2";

const makeProfile = (id: string, name: string): Profile => ({
  id,
  name,
  sportZones: {},
  createdAt: "2026-04-29T00:00:00Z",
  updatedAt: "2026-04-29T00:00:00Z",
});

const clearProfiles = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

describe("useProfilesLive", () => {
  beforeEach(clearProfiles);
  afterEach(clearProfiles);

  it("returns undefined while loading and resolves to the persisted list", async () => {
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_UUID_1, "A"));

    const { result } = renderHook(() => useProfilesLive());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].id).toBe(PROFILE_UUID_1);
  });

  it("re-fires when a new profile is written through PersistencePort", async () => {
    const persistence = createDexiePersistence(db);

    const { result } = renderHook(() => useProfilesLive());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    await persistence.profiles.put(makeProfile(PROFILE_UUID_2, "B"));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current?.[0].id).toBe(PROFILE_UUID_2);
    });
  });
});
