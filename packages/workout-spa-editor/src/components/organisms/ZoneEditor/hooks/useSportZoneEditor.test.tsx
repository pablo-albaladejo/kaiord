/* eslint-disable no-magic-numbers -- test fixtures use literal BPM/FTP/zone values for clarity */

/**
 * useSportZoneEditor hook tests.
 *
 * Coordinates the active sport tab + the sport-specific zone config
 * + the action surface. The Dexie live read is mocked so the hook
 * can be exercised against an in-memory PersistencePort: the mock
 * mirrors the production read contract (returns `Profile | undefined`
 * keyed by id).
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../../contexts/ToastContext";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import { ToastProvider } from "../../../atoms/Toast";

const profileMockRef: { current: Profile | undefined } = { current: undefined };

vi.mock("../../../../hooks/use-profile-by-id-live", () => ({
  useProfileByIdLive: () => profileMockRef.current,
}));

import { useSportZoneEditor } from "./useSportZoneEditor";

const buildProfile = (id: string): Profile => ({
  id,
  name: "Tester",
  sportZones: {
    cycling: {
      thresholds: { ftp: 250, lthr: 180 },
      heartRateZones: {
        method: "custom",
        zones: [{ zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 }],
      },
      powerZones: {
        method: "custom",
        zones: [{ zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 }],
      },
    },
    running: {
      thresholds: { thresholdPace: 300, paceUnit: "min_per_km", lthr: 180 },
      heartRateZones: { method: "karvonen-5", zones: [] },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
});

const wrap =
  (persistence: PersistencePort) =>
  ({ children }: { children: ReactNode }) => (
    <ToastProvider>
      <PersistenceProvider persistence={persistence}>
        <ToastContextProvider>{children}</ToastContextProvider>
      </PersistenceProvider>
    </ToastProvider>
  );

describe("useSportZoneEditor - initialization", () => {
  beforeEach(() => {
    profileMockRef.current = undefined;
  });

  it("should default the active sport to cycling", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    profileMockRef.current = buildProfile("p1");

    // Act
    const { result } = renderHook(() => useSportZoneEditor("p1"), {
      wrapper: wrap(persistence),
    });

    // Assert
    expect(result.current.activeSport).toBe("cycling");
    expect(result.current.capabilities).toStrictEqual({
      hr: true,
      power: true,
      pace: false,
    });
  });

  it("should expose the cycling sport config when the profile is loaded", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p2");
    profileMockRef.current = profile;

    // Act
    const { result } = renderHook(() => useSportZoneEditor("p2"), {
      wrapper: wrap(persistence),
    });

    // Assert
    expect(result.current.sportConfig).toStrictEqual(
      profile.sportZones.cycling
    );
  });

  it("should leave sportConfig undefined when the profile read has not resolved", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    profileMockRef.current = undefined;

    // Act
    const { result } = renderHook(() => useSportZoneEditor("missing"), {
      wrapper: wrap(persistence),
    });

    // Assert
    expect(result.current.sportConfig).toBeUndefined();
  });
});

describe("useSportZoneEditor - setActiveSport", () => {
  it("should swap the sport config and capabilities when activeSport changes", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p3");
    profileMockRef.current = profile;
    const { result } = renderHook(() => useSportZoneEditor("p3"), {
      wrapper: wrap(persistence),
    });

    // Act
    act(() => {
      result.current.setActiveSport("running");
    });

    // Assert
    expect(result.current.activeSport).toBe("running");
    expect(result.current.capabilities).toStrictEqual({
      hr: true,
      power: true,
      pace: true,
    });
    expect(result.current.sportConfig).toStrictEqual(
      profile.sportZones.running
    );
  });
});

describe("useSportZoneEditor - handleAddZone", () => {
  it("should append a default heart-rate zone via the actions surface", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p4");
    await persistence.profiles.put(profile);
    profileMockRef.current = profile;
    const { result } = renderHook(() => useSportZoneEditor("p4"), {
      wrapper: wrap(persistence),
    });

    // Act
    act(() => {
      result.current.handleAddZone("heartRateZones");
    });

    // Assert
    await vi.waitFor(async () => {
      const updated = await persistence.profiles.getById("p4");
      const zones =
        updated?.sportZones?.cycling?.heartRateZones?.zones ?? [];
      expect(zones).toHaveLength(2);
      expect(zones[1]).toMatchObject({ zone: 2, name: "Zone 2" });
    });
  });
});

describe("useSportZoneEditor - method-switch surface", () => {
  it("should stage a confirmation when handleMethodChange is called against a populated custom method", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    profileMockRef.current = buildProfile("p5");
    const { result } = renderHook(() => useSportZoneEditor("p5"), {
      wrapper: wrap(persistence),
    });

    // Act
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Assert
    expect(result.current.confirmMethod).toStrictEqual({
      zoneType: "powerZones",
      method: "coggan-7",
    });
  });

  it("should clear the staged confirmation when cancelMethodSwitch is called", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    profileMockRef.current = buildProfile("p6");
    const { result } = renderHook(() => useSportZoneEditor("p6"), {
      wrapper: wrap(persistence),
    });
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Act
    act(() => {
      result.current.cancelMethodSwitch();
    });

    // Assert
    expect(result.current.confirmMethod).toBeNull();
  });

  it("should persist the new method via confirmMethodSwitch", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p7");
    await persistence.profiles.put(profile);
    profileMockRef.current = profile;
    const { result } = renderHook(() => useSportZoneEditor("p7"), {
      wrapper: wrap(persistence),
    });
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Act
    act(() => {
      result.current.confirmMethodSwitch();
    });

    // Assert
    await vi.waitFor(async () => {
      const updated = await persistence.profiles.getById("p7");
      expect(updated?.sportZones?.cycling?.powerZones?.method).toBe(
        "coggan-7"
      );
    });
    expect(result.current.confirmMethod).toBeNull();
  });
});

describe("useSportZoneEditor - direct mutations", () => {
  it("should propagate updateSportThresholds via the actions surface", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p8");
    await persistence.profiles.put(profile);
    profileMockRef.current = profile;
    const { result } = renderHook(() => useSportZoneEditor("p8"), {
      wrapper: wrap(persistence),
    });

    // Act
    act(() => {
      result.current.updateSportThresholds("p8", "cycling", {
        ftp: 280,
        lthr: 175,
      });
    });

    // Assert
    await vi.waitFor(async () => {
      const updated = await persistence.profiles.getById("p8");
      expect(updated?.sportZones?.cycling?.thresholds.ftp).toBe(280);
    });
  });

  it("should propagate handleZonesChange via the actions surface", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = buildProfile("p9");
    await persistence.profiles.put(profile);
    profileMockRef.current = profile;
    const { result } = renderHook(() => useSportZoneEditor("p9"), {
      wrapper: wrap(persistence),
    });
    const newZones = [
      { zone: 1, name: "Active", minPercent: 0, maxPercent: 60 },
    ];

    // Act
    act(() => {
      result.current.handleZonesChange("powerZones", newZones);
    });

    // Assert
    await vi.waitFor(async () => {
      const updated = await persistence.profiles.getById("p9");
      expect(updated?.sportZones?.cycling?.powerZones?.zones).toStrictEqual(
        newZones
      );
      expect(updated?.sportZones?.cycling?.powerZones?.method).toBe("user");
    });
  });
});
