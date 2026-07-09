/* eslint-disable no-magic-numbers -- test fixtures use literal BPM/FTP/zone values for clarity */

/**
 * useZoneEditor hook tests.
 *
 * Coordinates a controlled-edit + validate + save pipeline over the
 * cycling sport-zone slice of a profile. Tests exercise both the
 * power-zone and heart-rate-zone branches plus the validation gating
 * around `handleSave`. Fixtures are built fresh per test because the
 * hook mutates zones in-place when `handleZoneChange` is invoked.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  HeartRateZone,
  PowerZone,
  Profile,
} from "../../../../types/profile";
import { useZoneEditor } from "./useZoneEditor";

const POWER_MIN_PCT_5 = 5;

const buildHrZones = (): Array<HeartRateZone> => [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
];

const buildPowerZonesValid = (): Array<PowerZone> => [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
];

const buildBaseProfile = (): Profile => ({
  id: "p1",
  name: "Tester",
  sportZones: {
    cycling: {
      thresholds: { ftp: 250, lthr: 180 },
      heartRateZones: { method: "custom", zones: buildHrZones() },
      powerZones: { method: "custom", zones: buildPowerZonesValid() },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: buildHrZones() },
    },
  },
  linkedAccounts: [],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
});

describe("useZoneEditor - initialization", () => {
  it("should hydrate zones from the cycling powerZones config when zoneType is power", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();

    // Act
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );

    // Assert
    expect(result.current.zones).toStrictEqual(buildPowerZonesValid());
    expect(result.current.isPowerZones).toBe(true);
    expect(result.current.validationErrors).toStrictEqual([]);
  });

  it("should hydrate zones from the cycling heartRateZones config when zoneType is heartRate", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();

    // Act
    const { result } = renderHook(() =>
      useZoneEditor(profile, "heartRate", onSave)
    );

    // Assert
    expect(result.current.zones).toStrictEqual(buildHrZones());
    expect(result.current.isPowerZones).toBe(false);
  });

  it("should fall back to an empty list when powerZones is missing on the cycling slice", () => {
    // Arrange
    const onSave = vi.fn();
    const profileNoPower: Profile = {
      ...buildBaseProfile(),
      sportZones: {
        cycling: {
          thresholds: { lthr: 180 },
          heartRateZones: { method: "custom", zones: buildHrZones() },
        },
        generic: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: buildHrZones() },
        },
      },
    };

    // Act
    const { result } = renderHook(() =>
      useZoneEditor(profileNoPower, "power", onSave)
    );

    // Assert
    expect(result.current.zones).toStrictEqual([]);
  });
});

describe("useZoneEditor - handleZoneChange", () => {
  it("should update a power-zone name field", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );

    // Act
    act(() => {
      result.current.handleZoneChange(0, "name", "Easy");
    });

    // Assert
    expect((result.current.zones[0] as PowerZone).name).toBe("Easy");
  });

  it("should update a power-zone minPercent and clear stale errors when valid", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );

    // Act
    act(() => {
      result.current.handleZoneChange(0, "minPercent", POWER_MIN_PCT_5);
    });

    // Assert
    expect((result.current.zones[0] as PowerZone).minPercent).toBe(
      POWER_MIN_PCT_5
    );
    expect(result.current.validationErrors).toStrictEqual([]);
  });

  it("should surface a validation error when a power maxPercent edit overlaps the next zone", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );

    // Act
    act(() => {
      result.current.handleZoneChange(0, "maxPercent", 60);
    });

    // Assert
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
    expect(
      result.current.validationErrors.some((e) => e.code === "overlap")
    ).toBe(true);
  });

  it("should update a heart-rate minBpm field", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "heartRate", onSave)
    );

    // Act
    act(() => {
      result.current.handleZoneChange(0, "minBpm", 95);
    });

    // Assert
    expect((result.current.zones[0] as HeartRateZone).minBpm).toBe(95);
  });

  it("should ignore a power-only field name when zoneType is heartRate", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "heartRate", onSave)
    );
    const before = { ...(result.current.zones[0] as HeartRateZone) };

    // Act
    act(() => {
      result.current.handleZoneChange(0, "minPercent", 999);
    });

    // Assert
    expect(result.current.zones[0]).toStrictEqual(before);
  });
});

describe("useZoneEditor - handleSave", () => {
  it("should invoke onSave with the current zones when validation passes", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );

    // Act
    act(() => {
      result.current.handleSave();
    });

    // Assert
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith(buildPowerZonesValid());
  });

  it("should suppress onSave and surface validation errors when zones are invalid", () => {
    // Arrange
    const onSave = vi.fn();
    const profile = buildBaseProfile();
    const { result } = renderHook(() =>
      useZoneEditor(profile, "power", onSave)
    );
    act(() => {
      result.current.handleZoneChange(0, "maxPercent", 0);
    });

    // Act
    act(() => {
      result.current.handleSave();
    });

    // Assert
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });
});
