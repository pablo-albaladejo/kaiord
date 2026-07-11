import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../types/coaching-account";
import type { Profile } from "../types/profile";
import type { CoachingSyncState } from "./use-coaching-activities";
import { useCoachingAutoSync } from "./use-coaching-auto-sync";
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const NO_FIRE_SETTLE_MS = 5 as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const ONE_MINUTE_MS = 60_000 as const;

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
    // Arrange
    const src = makeSource();

    // Act
    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Assert
    await waitFor(() => {
      expect(src.sync).toHaveBeenCalledWith("2026-04-13");
    });
  });

  it("should do NOT fire when profile has no linked account for that source", async () => {
    // Arrange
    mockProfile = {
      id: "p1",
      profile: { ...linkedProfile, linkedAccounts: [] },
    };
    const src = makeSource({ linked: false });
    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

    // Assert
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should do NOT fire when no profile is active", async () => {
    // Arrange
    mockProfile = { id: null, profile: null };
    const src = makeSource();
    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

    // Assert
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should do NOT fire when weekStart is undefined", async () => {
    // Arrange
    const src = makeSource();
    renderHook(() => useCoachingAutoSync([src], undefined), {
      wrapper: ({ children }) => wrap(children),
    });

    // Act
    await new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

    // Assert
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should skip sync when lastSyncedAt is fresh (<10min)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const recent = new Date(Date.now() - ONE_MINUTE_MS).toISOString();
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

    // Act
    await new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

    // Assert
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should fire sync when sources populate after an initial empty-sources run", async () => {
    // Arrange
    // Bridge detection lands AFTER profile/week settle: the first effect
    // run sees zero sources and must not burn the week key.
    const src = makeSource();
    const { rerender } = renderHook(
      ({ sources }: { sources: CoachingSyncState[] }) =>
        useCoachingAutoSync(sources, "2026-04-13"),
      {
        initialProps: { sources: [] as CoachingSyncState[] },
        wrapper: ({ children }) => wrap(children),
      }
    );
    await new Promise((r) => setTimeout(r, NO_FIRE_SETTLE_MS));

    // Act
    // The bridge announces itself and the source list re-emits.
    rerender({ sources: [src] });

    // Assert
    await waitFor(() => {
      expect(src.sync).toHaveBeenCalledWith("2026-04-13");
    });
  });

  it("should invalidate staleness on profile switch — A's fresh row does NOT suppress sync for B", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const recent = new Date(Date.now() - ONE_MINUTE_MS).toISOString();
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

    // Act
    renderHook(() => useCoachingAutoSync([src], "2026-04-13"), {
      wrapper: ({ children }) => (
        <PersistenceProvider persistence={persistence}>
          {children}
        </PersistenceProvider>
      ),
    });

    // Assert
    await waitFor(() => {
      expect(src.sync).toHaveBeenCalledWith("2026-04-13");
    });
  });
});
