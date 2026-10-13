/**
 * Device preferences: language, units and notifications describe the person
 * reading this screen, not the athlete being managed, so they live in this
 * browser's localStorage (like the theme) and never ride the Drive snapshot.
 *
 * `read()` returns `null` until the device has a record; that is the signal
 * to seed it once from the active profile's legacy `userPreferences` values.
 * When storage throws (private mode, blocked site data) the store keeps the
 * values in memory for the session instead.
 */

import {
  type DevicePreferences,
  devicePreferencesSchema,
  pickDevicePreferences,
} from "../types/device-preferences";

export const DEVICE_PREFERENCES_KEY = "kaiord-device-preferences";

export type DevicePreferencesStore = {
  read: () => DevicePreferences | null;
  write: (next: DevicePreferences) => void;
  seedFrom: (source: DevicePreferences | undefined) => void;
  subscribe: (listener: () => void) => () => void;
};

const parse = (raw: string): DevicePreferences | null => {
  try {
    const result = devicePreferencesSchema.safeParse(JSON.parse(raw));
    return result.success ? pickDevicePreferences(result.data) : null;
  } catch {
    return null;
  }
};

export function createDevicePreferencesStore(
  getStorage: () => Storage
): DevicePreferencesStore {
  const listeners = new Set<() => void>();
  let memory: DevicePreferences | null = null;
  let storageFailed = false;
  // Same raw string → same object, as useSyncExternalStore requires.
  let cachedRaw: string | null = null;
  let cachedValue: DevicePreferences | null = null;

  const read = (): DevicePreferences | null => {
    if (storageFailed) return memory;
    try {
      const raw = getStorage().getItem(DEVICE_PREFERENCES_KEY);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = raw === null ? null : parse(raw);
      }
      return cachedValue;
    } catch {
      storageFailed = true;
      return memory;
    }
  };

  const write = (next: DevicePreferences): void => {
    const value = pickDevicePreferences(next);
    memory = value;
    try {
      getStorage().setItem(DEVICE_PREFERENCES_KEY, JSON.stringify(value));
    } catch {
      storageFailed = true;
    }
    listeners.forEach((listener) => listener());
  };

  const seedFrom = (source: DevicePreferences | undefined): void => {
    if (read() === null) write(pickDevicePreferences(source));
  };

  const subscribe = (listener: () => void) => {
    // Another tab changing the preference fires `storage` here.
    const onStorage = (event: StorageEvent) => {
      if (event.key === DEVICE_PREFERENCES_KEY || event.key === null)
        listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { read, write, seedFrom, subscribe };
}

export const devicePreferencesStore = createDevicePreferencesStore(
  () => window.localStorage
);
