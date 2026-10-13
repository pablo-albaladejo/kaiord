/**
 * useDevicePreferences — reactive read of this device's language, units and
 * notifications choice, independent of the active profile.
 *
 * Migration: while the device has no record yet, the active profile's legacy
 * `userPreferences` values stand in and are copied to the device once they
 * resolve. From then on the profile values are never read again, so
 * switching profile cannot change them.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { devicePreferencesStore } from "../lib/device-preferences";
import {
  type DevicePreferences,
  pickDevicePreferences,
} from "../types/device-preferences";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useUserPreferences } from "./use-user-preferences";

export type DevicePreferencesState = {
  prefs: DevicePreferences;
  /** False until the device record exists, so a write cannot race the seed. */
  ready: boolean;
  update: (patch: DevicePreferences) => void;
};

export const useDevicePreferences = (): DevicePreferencesState => {
  const stored = useSyncExternalStore(
    devicePreferencesStore.subscribe,
    devicePreferencesStore.read
  );
  const active = useActiveProfileLive();
  const legacy = useUserPreferences({
    profileId: stored === null ? (active?.id ?? null) : null,
    defaultView: "grid",
  });

  useEffect(() => {
    if (stored === null && legacy) devicePreferencesStore.seedFrom(legacy);
  }, [stored, legacy]);

  const prefs = stored ?? pickDevicePreferences(legacy);
  const update = useCallback(
    (patch: DevicePreferences) =>
      devicePreferencesStore.write({ ...prefs, ...patch }),
    [prefs]
  );

  return { prefs, ready: stored !== null || active?.id === null, update };
};
