/**
 * Dexie-backed hook test: the checklist must tick from real persisted state,
 * never from a "seen it" flag. The load-bearing case is `set-thresholds` —
 * every profile ships fully populated default zone arrays, so a zone-array
 * test would tick on day zero.
 */
import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { ConnectionRecord } from "../types/connection";
import type { ExportLedgerEntry } from "../types/export-ledger";
import type { Profile } from "../types/profile";
import {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../types/profile-defaults";
import type { UserPreferences } from "../types/user-preferences";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useSetupChecklist } from "./use-setup-checklist";

// The discovery singleton is an in-memory store with no seeding surface, so
// the `bridges.length > 0` branch of the source item is only reachable through
// a mock. Every test but one runs with an empty snapshot.
const useDiscoveredBridges = vi.hoisted(() => vi.fn());

vi.mock("./use-discovered-bridges", () => ({ useDiscoveredBridges }));

const NO_BRIDGES: readonly DiscoveredBridge[] = [];
const ONE_BRIDGE: readonly DiscoveredBridge[] = [
  { bridgeId: "garmin-bridge", extensionId: "extension-id" },
];

const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const TOTAL_ITEMS = 4;

const DEFAULT_CYCLING_ZONES = {
  thresholds: {},
  heartRateZones: { method: "default", zones: DEFAULT_HEART_RATE_ZONES },
  powerZones: { method: "default", zones: DEFAULT_POWER_ZONES },
};

const DEFAULT_ZONED_PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Fresh Rider",
  sportZones: { cycling: DEFAULT_CYCLING_ZONES },
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const PROFILE_WITH_FTP: Profile = {
  ...DEFAULT_ZONED_PROFILE,
  sportZones: {
    cycling: { ...DEFAULT_CYCLING_ZONES, thresholds: { ftp: 250 } },
  },
};

const TABLES = [
  "profiles",
  "meta",
  "workouts",
  "connections",
  "exportLedger",
  "userPreferences",
];

const clearTables = async (): Promise<void> => {
  for (const table of TABLES) await db.table(table).clear();
};

const seedProfile = async (profile: Profile = DEFAULT_ZONED_PROFILE) => {
  await db.table<Profile>("profiles").put(profile);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
};

const itemById = (
  result: ReturnType<typeof useSetupChecklist>,
  id: string
): boolean => result.items.find((item) => item.id === id)?.done ?? false;

describe("useSetupChecklist", () => {
  beforeEach(async () => {
    useDiscoveredBridges.mockReturnValue(NO_BRIDGES);
    await clearTables();
  });
  afterEach(clearTables);

  it("should report nothing done for a fresh profile", async () => {
    // Arrange
    await seedProfile();

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });
    expect(result.current.doneCount).toBe(0);
    expect(result.current.total).toBe(TOTAL_ITEMS);
    expect(result.current.complete).toBe(false);
  });

  it("should NOT tick the zones item for a profile carrying only default zones", async () => {
    // Arrange
    await seedProfile();

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });
    expect(DEFAULT_POWER_ZONES.length).toBeGreaterThan(0);
    expect(itemById(result.current, "set-thresholds")).toBe(false);
  });

  it("should tick the zones item once a threshold is set", async () => {
    // Arrange
    await seedProfile(PROFILE_WITH_FTP);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "set-thresholds")).toBe(true);
    });
  });

  it("should tick the zones item from a non-power threshold", async () => {
    // Arrange
    await seedProfile({
      ...DEFAULT_ZONED_PROFILE,
      sportZones: {
        swimming: {
          thresholds: { thresholdPace: 95 },
          heartRateZones: { method: "default", zones: [] },
        },
      },
    });

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "set-thresholds")).toBe(true);
    });
  });

  it("should tick the workout item from the profile's workout count", async () => {
    // Arrange
    await seedProfile();
    await db
      .table("workouts")
      .put({ id: "w1", profileId: PROFILE_ID, date: "2026-07-28" });

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "create-workout")).toBe(true);
    });
  });

  it("should NOT tick the workout item for another profile's workouts", async () => {
    // Arrange
    await seedProfile();
    await db
      .table("workouts")
      .put({ id: "w2", profileId: "other-profile", date: "2026-07-28" });

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });
    expect(itemById(result.current, "create-workout")).toBe(false);
  });

  it("should tick the source item from a connected connection record", async () => {
    // Arrange
    await seedProfile();
    const record: ConnectionRecord = {
      profileId: PROFILE_ID,
      providerId: "garmin",
      status: "connected",
      mechanism: "bridge",
      updatedAt: "2026-07-28T00:00:00.000Z",
    };
    await db.table<ConnectionRecord>("connections").put(record);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "connect-source")).toBe(true);
    });
  });

  it("should tick the source item from a discovered bridge alone", async () => {
    // Arrange
    await seedProfile();
    useDiscoveredBridges.mockReturnValue(ONE_BRIDGE);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "connect-source")).toBe(true);
    });
    expect(await db.table("connections").count()).toBe(0);
  });

  it("should NOT tick the source item for a disconnected connection record", async () => {
    // Arrange
    await seedProfile();
    const record: ConnectionRecord = {
      profileId: PROFILE_ID,
      providerId: "garmin",
      status: "disconnected",
      mechanism: "bridge",
      updatedAt: "2026-07-28T00:00:00.000Z",
    };
    await db.table<ConnectionRecord>("connections").put(record);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });
    expect(itemById(result.current, "connect-source")).toBe(false);
  });

  it("should tick an item written after mount, without a re-render from the caller", async () => {
    // Arrange
    await seedProfile();
    const { result } = renderHook(() => useSetupChecklist());
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });
    expect(itemById(result.current, "create-workout")).toBe(false);

    // Act
    await db
      .table("workouts")
      .put({ id: "w4", profileId: PROFILE_ID, date: "2026-07-28" });

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "create-workout")).toBe(true);
    });
  });

  it("should tick the push item from a workout export-ledger entry", async () => {
    // Arrange
    await seedProfile();
    const entry: ExportLedgerEntry = {
      id: "11111111-1111-1111-1111-111111111111",
      kaiordRecordId: "22222222-2222-2222-2222-222222222222",
      dataType: "workout",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "gc-1",
      contentHash: "hash",
      exportedAt: "2026-07-28T00:00:00.000Z",
    };
    await db.table<ExportLedgerEntry>("exportLedger").put(entry);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(itemById(result.current, "push-session")).toBe(true);
    });
  });

  it("should report dismissed when the preference row says so", async () => {
    // Arrange
    await seedProfile();
    const prefs: UserPreferences = {
      profileId: PROFILE_ID,
      calendarView: "grid",
      setupChecklistDismissed: true,
      updatedAt: "2026-07-28T00:00:00.000Z",
    };
    await db.table<UserPreferences>("userPreferences").put(prefs);

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.dismissed).toBe(true);
    });
  });

  it("should persist the dismissal to the userPreferences row", async () => {
    // Arrange
    await seedProfile();
    const { result } = renderHook(() => useSetupChecklist());
    await waitFor(() => {
      expect(result.current.dismissed).toBe(false);
    });

    // Act
    result.current.dismiss();

    // Assert
    await waitFor(async () => {
      const row = await db
        .table<UserPreferences>("userPreferences")
        .get(PROFILE_ID);
      expect(row?.setupChecklistDismissed).toBe(true);
    });
    await waitFor(() => {
      expect(result.current.dismissed).toBe(true);
    });
  });

  it("should report dismissed while no profile is active", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.doneCount).toBe(0);
    });
    expect(result.current.dismissed).toBe(true);
  });

  it("should report complete once every item is done", async () => {
    // Arrange
    await seedProfile(PROFILE_WITH_FTP);
    await db
      .table("workouts")
      .put({ id: "w3", profileId: PROFILE_ID, date: "2026-07-28" });
    await db.table("connections").put({
      profileId: PROFILE_ID,
      providerId: "garmin",
      status: "connected",
      mechanism: "bridge",
      updatedAt: "2026-07-28T00:00:00.000Z",
    });
    await db.table("exportLedger").put({
      id: "44444444-4444-4444-4444-444444444444",
      kaiordRecordId: "55555555-5555-5555-5555-555555555555",
      dataType: "workout",
      destinationBridgeId: "garmin-bridge",
      destinationExternalId: "gc-2",
      contentHash: "hash",
      exportedAt: "2026-07-28T00:00:00.000Z",
    });

    // Act
    const { result } = renderHook(() => useSetupChecklist());

    // Assert
    await waitFor(() => {
      expect(result.current.complete).toBe(true);
    });
    expect(result.current.doneCount).toBe(TOTAL_ITEMS);
  });
});
