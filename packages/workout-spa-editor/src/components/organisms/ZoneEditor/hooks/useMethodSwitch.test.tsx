/**
 * useMethodSwitch hook tests.
 *
 * Owns the confirm-before-overwriting-custom-zones flow when the user
 * picks a new zone-method from the dropdown. The two interesting
 * branches: (a) current method is "custom" with non-empty zones —
 * stage a confirmation; (b) every other shape — apply immediately by
 * computing zones from the chosen method + thresholds.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ZoneType } from "../../../../application/profile/zones/zone-types";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone, SportZoneConfig } from "../../../../types/sport-zones";
import { useMethodSwitch } from "./useMethodSwitch";

const customHrZones: Array<HeartRateZone> = [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
];

const customPowerZones: Array<PowerZone> = [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
];

const customPaceZones: Array<PaceZone> = [
  { zone: 1, name: "Z1", minPace: 360, maxPace: 420, unit: "min_per_km" },
];

const sportConfigCustom: SportZoneConfig = {
  thresholds: {
    lthr: 180,
    ftp: 250,
    thresholdPace: 300,
    paceUnit: "min_per_km",
  },
  heartRateZones: { method: "custom", zones: customHrZones },
  powerZones: { method: "custom", zones: customPowerZones },
  paceZones: { method: "custom", zones: customPaceZones },
};

const sportConfigFormula: SportZoneConfig = {
  thresholds: {
    lthr: 180,
    ftp: 250,
    thresholdPace: 300,
    paceUnit: "min_per_km",
  },
  heartRateZones: { method: "karvonen-5", zones: [] },
  powerZones: { method: "coggan-7", zones: [] },
  paceZones: { method: "daniels-5", zones: [] },
};

describe("useMethodSwitch - handleMethodChange", () => {
  it("should stage a confirmation when current method is custom with non-empty zones", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigCustom, onApply)
    );

    // Act
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Assert
    expect(result.current.confirmMethod).toStrictEqual({
      zoneType: "powerZones",
      method: "coggan-7",
    });
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should apply immediately when current method is custom but zones are empty", () => {
    // Arrange
    const onApply = vi.fn();
    const cfg: SportZoneConfig = {
      ...sportConfigCustom,
      powerZones: { method: "custom", zones: [] },
    };
    const { result } = renderHook(() => useMethodSwitch(cfg, onApply));

    // Act
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Assert
    expect(result.current.confirmMethod).toBeNull();
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("should apply immediately when current method is a formula", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigFormula, onApply)
    );

    // Act
    act(() => {
      result.current.handleMethodChange("powerZones", "british-cycling-6");
    });

    // Assert
    expect(onApply).toHaveBeenCalledOnce();
    const [zoneType, method, zones] = onApply.mock.calls[0];
    expect(zoneType).toBe("powerZones");
    expect(method).toBe("british-cycling-6");
    expect(Array.isArray(zones)).toBe(true);
    expect((zones as Array<unknown>).length).toBeGreaterThan(0);
  });

  it("should pass through the existing zones array when the new method is custom", () => {
    // Arrange
    const onApply = vi.fn();
    const cfg: SportZoneConfig = {
      ...sportConfigFormula,
      powerZones: { method: "coggan-7", zones: customPowerZones },
    };
    const { result } = renderHook(() => useMethodSwitch(cfg, onApply));

    // Act
    act(() => {
      result.current.handleMethodChange("powerZones", "custom");
    });

    // Assert
    expect(onApply).toHaveBeenCalledWith(
      "powerZones",
      "custom",
      customPowerZones
    );
  });

  it("should compute heart-rate zones from LTHR when switching to a formula", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigFormula, onApply)
    );

    // Act
    act(() => {
      result.current.handleMethodChange("heartRateZones", "karvonen-5");
    });

    // Assert
    expect(onApply).toHaveBeenCalledOnce();
    const zones = onApply.mock.calls[0][2] as Array<unknown>;
    expect(zones.length).toBeGreaterThan(0);
  });

  it("should no-op when switching heartRate to a formula and LTHR is missing", () => {
    // Arrange
    const onApply = vi.fn();
    const cfg: SportZoneConfig = {
      ...sportConfigFormula,
      thresholds: {},
    };
    const { result } = renderHook(() => useMethodSwitch(cfg, onApply));

    // Act
    act(() => {
      result.current.handleMethodChange("heartRateZones", "karvonen-5");
    });

    // Assert
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should no-op when switching pace to a formula and threshold pace data is missing", () => {
    // Arrange
    const onApply = vi.fn();
    const cfg: SportZoneConfig = {
      ...sportConfigFormula,
      thresholds: { lthr: 180, ftp: 250 },
    };
    const { result } = renderHook(() => useMethodSwitch(cfg, onApply));

    // Act
    act(() => {
      result.current.handleMethodChange("paceZones", "daniels-5");
    });

    // Assert
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should compute pace zones when threshold pace and unit are present", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigFormula, onApply)
    );

    // Act
    act(() => {
      result.current.handleMethodChange("paceZones", "daniels-5");
    });

    // Assert
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0]).toBe("paceZones");
    expect(onApply.mock.calls[0][1]).toBe("daniels-5");
  });

  it("should apply immediately when sportConfig is undefined (no current method)", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() => useMethodSwitch(undefined, onApply));

    // Act
    act(() => {
      result.current.handleMethodChange(
        "powerZones" satisfies ZoneType,
        "coggan-7"
      );
    });

    // Assert
    // No LTHR or FTP available — falls through the power branch with an empty zones array.
    expect(onApply).toHaveBeenCalledOnce();
    expect(result.current.confirmMethod).toBeNull();
  });
});

describe("useMethodSwitch - confirmMethodSwitch", () => {
  it("should apply the staged switch and clear the confirmation", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigCustom, onApply)
    );
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Act
    act(() => {
      result.current.confirmMethodSwitch();
    });

    // Assert
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0]).toBe("powerZones");
    expect(onApply.mock.calls[0][1]).toBe("coggan-7");
    expect(result.current.confirmMethod).toBeNull();
  });

  it("should be a no-op when no confirmation is pending", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigCustom, onApply)
    );

    // Act
    act(() => {
      result.current.confirmMethodSwitch();
    });

    // Assert
    expect(onApply).not.toHaveBeenCalled();
    expect(result.current.confirmMethod).toBeNull();
  });
});

describe("useMethodSwitch - cancelMethodSwitch", () => {
  it("should clear the staged confirmation without applying it", () => {
    // Arrange
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useMethodSwitch(sportConfigCustom, onApply)
    );
    act(() => {
      result.current.handleMethodChange("powerZones", "coggan-7");
    });

    // Act
    act(() => {
      result.current.cancelMethodSwitch();
    });

    // Assert
    expect(result.current.confirmMethod).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });
});
