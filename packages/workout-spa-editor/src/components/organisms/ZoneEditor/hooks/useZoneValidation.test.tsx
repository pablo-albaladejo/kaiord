/**
 * useZoneValidation hook tests.
 *
 * Pure validation logic that flags two failure modes per zone:
 * (1) min >= max within the zone, (2) overlap with the next zone.
 * Uses renderHook to read the returned validator without coupling
 * to a host component.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import { useZoneValidation } from "./useZoneValidation";

describe("useZoneValidation - power zones", () => {
  it("should return no errors for valid ascending power zones", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(true));
    const zones: Array<PowerZone> = [
      { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
      { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
      { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it("should flag a power zone whose minPercent equals maxPercent", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(true));
    const zones: Array<PowerZone> = [
      { zone: 1, name: "Z1", minPercent: 50, maxPercent: 50 },
      { zone: 2, name: "Z2", minPercent: 60, maxPercent: 75 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toContainEqual({
      zone: 1,
      message: "Min must be less than max",
    });
  });

  it("should flag a power zone whose minPercent exceeds maxPercent", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(true));
    const zones: Array<PowerZone> = [
      { zone: 1, name: "Z1", minPercent: 80, maxPercent: 50 },
      { zone: 2, name: "Z2", minPercent: 81, maxPercent: 90 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(
      errors.some(
        (e) => e.zone === 1 && e.message === "Min must be less than max"
      )
    ).toBe(true);
  });

  it("should flag overlap between consecutive power zones", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(true));
    const zones: Array<PowerZone> = [
      { zone: 1, name: "Z1", minPercent: 0, maxPercent: 60 },
      { zone: 2, name: "Z2", minPercent: 55, maxPercent: 75 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toContainEqual({
      zone: 1,
      message: "Overlaps with next zone",
    });
  });

  it("should not flag overlap when boundaries are strictly increasing", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(true));
    const zones: Array<PowerZone> = [
      { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
      { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors.filter((e) => e.message === "Overlaps with next zone")).toHaveLength(
      0
    );
  });
});

describe("useZoneValidation - heart-rate zones", () => {
  it("should return no errors for valid ascending HR zones", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));
    const zones: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
      { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it("should flag a HR zone whose minBpm equals maxBpm", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));
    const zones: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 120, maxBpm: 120 },
      { zone: 2, name: "Z2", minBpm: 130, maxBpm: 160 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toContainEqual({
      zone: 1,
      message: "Min must be less than max",
    });
  });

  it("should flag overlap between consecutive HR zones", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));
    const zones: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 100, maxBpm: 135 },
      { zone: 2, name: "Z2", minBpm: 130, maxBpm: 160 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toContainEqual({
      zone: 1,
      message: "Overlaps with next zone",
    });
  });

  it("should accumulate multiple errors across zones", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));
    const zones: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 130, maxBpm: 100 },
      { zone: 2, name: "Z2", minBpm: 90, maxBpm: 120 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("should accept an empty zone list as valid", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));

    // Act
    const errors = result.current.validateZones([]);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it("should not flag the last zone for overlap (no successor)", () => {
    // Arrange
    const { result } = renderHook(() => useZoneValidation(false));
    const zones: Array<HeartRateZone> = [
      { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
    ];

    // Act
    const errors = result.current.validateZones(zones);

    // Assert
    expect(errors).toStrictEqual([]);
  });
});
