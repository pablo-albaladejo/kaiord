import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../types/coaching-account";
import type { Profile } from "../types/profile";
import type { CoachingSyncState } from "./use-coaching-activities";
import { useCoachingAutoSync } from "./use-coaching-auto-sync";

const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const linkedProfile: Profile = {
  id: "p1",
  name: "Pablo",
  sportZones: {},
  linkedAccounts: [T2G_LINK],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

let mockProfile: { id: string | null; profile: Profile | null } = {
  id: "p1",
  profile: linkedProfile,
};

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => mockProfile,
}));

const makeSource = (
  overrides: Partial<CoachingSyncState> = {}
): CoachingSyncState => ({
  id: "train2go",
  label: "Train2Go",
  linked: true,
  connected: true,
  loading: false,
  error: null,
  sync: vi.fn(async () => undefined),
  connect: vi.fn(async () => undefined),
  ...overrides,
});

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("useCoachingAutoSync", () => {
  beforeEach(() => {
    mockProfile = { id: "p1", profile: linkedProfile };
  });

  it("should fire sync for each linked source on mount when stale", async () => {
    const src = makeSource();

    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    await waitFor(() => {
      expect(src.sync).toHaveBeenCalledWith("2026-04-13");
    });
  });

  it("should do NOT fire when profile has no linked account for that source", async () => {
    mockProfile = {
      id: "p1",
      profile: { ...linkedProfile, linkedAccounts: [] },
    };
    const src = makeSource({ linked: false });

    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Give the effect a tick to run; assert it stayed silent.
    await new Promise((r) => setTimeout(r, 5));
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should do NOT fire when no profile is active", async () => {
    mockProfile = { id: null, profile: null };
    const src = makeSource();

    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should do NOT fire when weekStart is undefined", async () => {
    const src = makeSource();

    renderHook(() => useCoachingAutoSync([src], undefined), {
      wrapper: ({ children }) => wrap(children),
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should skip sync when lastSyncedAt is fresh (<10min)", async () => {
    const persistence = createInMemoryPersistence();
    const recent = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    await persistence.coachingSyncState.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: recent,
    });
    const src = makeSource();

    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => (
        <PersistenceProvider persistence={persistence}>
          {children}
        </PersistenceProvider>
      ),
    });

    await new Promise((r) => setTimeout(r, 5));
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("profile switch invalidates staleness — A's fresh row does NOT suppress sync for B", async () => {
    // Profile A has a fresh syncState row; the active profile is B which has
    // no row at all. The hook MUST read B's own row, not A's.
    const persistence = createInMemoryPersistence();
    const recent = new Date(Date.now() - 60_000).toISOString();
    await persistence.coachingSyncState.put({
      source: "train2go",
      profileId: "p1", // A's row — must NOT suppress B
      lastSyncedAt: recent,
    });
    mockProfile = {
      id: "p2",
      profile: { ...linkedProfile, id: "p2" },
    };
    const src = makeSource();

    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => (
        <PersistenceProvider persistence={persistence}>
          {children}
        </PersistenceProvider>
      ),
    });

    // B has no syncState row → stale → sync fires
    await waitFor(() => {
      expect(src.sync).toHaveBeenCalledWith("2026-04-13");
    });
  });
});
