/**
 * Co-located test for `useActiveProfileLive`.
 *
 * Verifies the composed `meta.activeProfileId` + `profiles.get(id)`
 * join inside a single `useLiveQuery` callback (D1) is observed
 * atomically within the same tab — consumers MUST never see
 * `{ id: "B", profile: null }` or `{ id: "B", profile: ProfileA }`
 * as an intermediate render.
 *
 * Atomicity is delivered by `useLiveQuery`'s implicit per-callback
 * Dexie read transaction (D1), NOT by writers using
 * `persistence.transaction` — so we exercise it with bare repository
 * writes here.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { Profile } from "../types/profile";
import {
  type ActiveProfile,
  useActiveProfileLive,
} from "./use-active-profile-live";

const PROFILE_A = "00000000-0000-4000-8000-0000000000c1";
const PROFILE_B = "00000000-0000-4000-8000-0000000000c2";
const UNRELATED = "00000000-0000-4000-8000-0000000000c9";

const makeProfile = (id: string, name: string): Profile => ({
  id,
  name,
  sportZones: {},
  createdAt: "2026-04-29T00:00:00Z",
  updatedAt: "2026-04-29T00:00:00Z",
});

const clear = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

describe("useActiveProfileLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return { id: null, profile: null } when no active profile is set", async () => {
    const { result } = renderHook(() => useActiveProfileLive());

    await waitFor(() => {
      expect(result.current).toEqual({ id: null, profile: null });
    });
  });

  it("should resolve to the active profile and re-fires when active id changes", async () => {
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_A, "A"));
    await persistence.profiles.setActiveId(PROFILE_A);

    const { result } = renderHook(() => useActiveProfileLive());

    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_A);
      expect(result.current?.profile?.name).toBe("A");
    });

    await persistence.profiles.put(makeProfile(PROFILE_B, "B"));
    await persistence.profiles.setActiveId(PROFILE_B);

    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_B);
      expect(result.current?.profile?.name).toBe("B");
    });
  });

  it("should never observe an intermediate { id: B, profile: ProfileA | null } during a same-tab transition", async () => {
    const persistence = createDexiePersistence(db);
    await persistence.profiles.put(makeProfile(PROFILE_A, "A"));
    await persistence.profiles.put(makeProfile(PROFILE_B, "B"));
    await persistence.profiles.setActiveId(PROFILE_A);

    const observed: ActiveProfile[] = [];
    const { result } = renderHook(() => {
      const value = useActiveProfileLive();
      if (value !== undefined) observed.push(value);
      return value;
    });

    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_A);
      expect(result.current?.profile?.id).toBe(PROFILE_A);
    });

    // Same-tab transition: change active id, then make an unrelated
    // profiles-table mutation. The atomic join inside useLiveQuery
    // must never expose { id: B, profile: A } or { id: B, profile: null }.
    await persistence.profiles.setActiveId(PROFILE_B);
    await persistence.profiles.put(makeProfile(UNRELATED, "Unrelated"));

    await waitFor(() => {
      expect(result.current?.id).toBe(PROFILE_B);
      expect(result.current?.profile?.id).toBe(PROFILE_B);
    });

    for (const snapshot of observed) {
      const inconsistent =
        snapshot.id === PROFILE_B && snapshot.profile?.id !== PROFILE_B;
      expect(inconsistent).toBe(false);
    }
  });
});
