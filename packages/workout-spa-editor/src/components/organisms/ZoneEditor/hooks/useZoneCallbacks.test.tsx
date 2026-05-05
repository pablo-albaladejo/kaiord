/**
 * useZoneCallbacks hook tests.
 *
 * Builds inline-edit callbacks for the zone table. The hook delegates
 * value parsing/cascading to `applyValueChange` (covered by its own
 * unit suite); these tests verify the wiring: the callbacks invoke
 * `onZonesChange` with the expected payload, and inert paths (invalid
 * input, last-zone removal) produce no change.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";
import { useZoneCallbacks } from "./useZoneCallbacks";

const HR_BPM_125 = 125;
const POWER_THRESHOLD_W = 250;
const POWER_60_PCT = 60;
const PACE_7_MIN = 420;

const hrZones: Array<HeartRateZone> = [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
  { zone: 3, name: "Z3", minBpm: 161, maxBpm: 190 },
];

const powerZones: Array<PowerZone> = [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
];

const paceZones: Array<PaceZone> = [
  { zone: 1, name: "Z1", minPace: 360, maxPace: 420, unit: "min_per_km" },
  { zone: 2, name: "Z2", minPace: 300, maxPace: 359, unit: "min_per_km" },
];

describe("useZoneCallbacks - onNameChange", () => {
  it("should rename the zone at the given index without touching siblings", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: hrZones,
        type: "heartRate",
        onZonesChange,
      })
    );

    // Act
    result.current.onNameChange(1, "Tempo");

    // Assert
    expect(onZonesChange).toHaveBeenCalledOnce();
    const updated = onZonesChange.mock.calls[0][0] as Array<HeartRateZone>;
    expect(updated[1].name).toBe("Tempo");
    expect(updated[0]).toStrictEqual(hrZones[0]);
    expect(updated[2]).toStrictEqual(hrZones[2]);
  });
});

describe("useZoneCallbacks - onMinChange", () => {
  it("should propagate a parsed HR min change", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: hrZones,
        type: "heartRate",
        onZonesChange,
      })
    );

    // Act
    result.current.onMinChange(1, "125");

    // Assert
    expect(onZonesChange).toHaveBeenCalledOnce();
    const updated = onZonesChange.mock.calls[0][0] as Array<HeartRateZone>;
    expect(updated[1].minBpm).toBe(HR_BPM_125);
  });

  it("should not invoke onZonesChange when the raw value cannot be parsed", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: hrZones,
        type: "heartRate",
        onZonesChange,
      })
    );

    // Act
    result.current.onMinChange(0, "not-a-number");

    // Assert
    expect(onZonesChange).not.toHaveBeenCalled();
  });

  it("should pass the threshold through to the power parser", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: powerZones,
        type: "power",
        threshold: POWER_THRESHOLD_W,
        onZonesChange,
      })
    );

    // Act
    result.current.onMinChange(1, "150W");

    // Assert
    expect(onZonesChange).toHaveBeenCalledOnce();
    const updated = onZonesChange.mock.calls[0][0] as Array<PowerZone>;
    expect(updated[1].minPercent).toBe(POWER_60_PCT);
  });
});

describe("useZoneCallbacks - onMaxChange", () => {
  it("should propagate a parsed pace max change", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: paceZones,
        type: "pace",
        onZonesChange,
      })
    );

    // Act
    result.current.onMaxChange(0, "7:00");

    // Assert
    expect(onZonesChange).toHaveBeenCalledOnce();
    const updated = onZonesChange.mock.calls[0][0] as Array<PaceZone>;
    expect(updated[0].maxPace).toBe(PACE_7_MIN);
  });

  it("should not invoke onZonesChange when the pace string is malformed", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: paceZones,
        type: "pace",
        onZonesChange,
      })
    );

    // Act
    result.current.onMaxChange(0, "garbage");

    // Assert
    expect(onZonesChange).not.toHaveBeenCalled();
  });
});

describe("useZoneCallbacks - onRemove", () => {
  it("should drop the zone at the given index", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: hrZones,
        type: "heartRate",
        onZonesChange,
      })
    );

    // Act
    result.current.onRemove(1);

    // Assert
    expect(onZonesChange).toHaveBeenCalledOnce();
    const updated = onZonesChange.mock.calls[0][0] as Array<HeartRateZone>;
    expect(updated).toHaveLength(2);
    expect(updated[0]).toStrictEqual(hrZones[0]);
    expect(updated[1]).toStrictEqual(hrZones[2]);
  });

  it("should refuse to remove the last remaining zone", () => {
    // Arrange
    const onZonesChange = vi.fn();
    const single: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
    ];
    const { result } = renderHook(() =>
      useZoneCallbacks({
        zones: single,
        type: "heartRate",
        onZonesChange,
      })
    );

    // Act
    result.current.onRemove(0);

    // Assert
    expect(onZonesChange).not.toHaveBeenCalled();
  });
});
