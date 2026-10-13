import { describe, expect, it, vi } from "vitest";

import {
  createDevicePreferencesStore,
  DEVICE_PREFERENCES_KEY,
} from "./device-preferences";

const memoryStorage = (initial: Record<string, string> = {}): Storage => {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
};

const throwingStorage = (): Storage => {
  const fail = () => {
    throw new DOMException("denied", "SecurityError");
  };
  return { ...memoryStorage(), getItem: fail, setItem: fail };
};

describe("createDevicePreferencesStore", () => {
  it("should read null when the device has no record yet", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);

    // Act
    const prefs = store.read();

    // Assert
    expect(prefs).toBeNull();
  });

  it("should seed only the device fields from the active profile's preferences", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);
    const legacyRow = {
      profileId: "p1",
      calendarView: "grid",
      units: "imperial",
      locale: "es",
      activeSport: "cycling",
    } as const;

    // Act
    store.seedFrom(legacyRow);

    // Assert
    expect(store.read()).toEqual({ units: "imperial", locale: "es" });
    expect(JSON.parse(storage.getItem(DEVICE_PREFERENCES_KEY) ?? "")).toEqual({
      units: "imperial",
      locale: "es",
    });
  });

  it("should not seed when the device already has preferences", () => {
    // Arrange
    const storage = memoryStorage({
      [DEVICE_PREFERENCES_KEY]: JSON.stringify({ units: "metric" }),
    });
    const store = createDevicePreferencesStore(() => storage);

    // Act
    store.seedFrom({ units: "imperial", locale: "es" });

    // Assert
    expect(store.read()).toEqual({ units: "metric" });
  });

  it("should seed an empty record from a profile with no preferences", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);

    // Act
    store.seedFrom(undefined);

    // Assert
    expect(store.read()).toEqual({});
  });

  it("should return the same object for unchanged storage", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);
    store.write({ locale: "es" });

    // Act
    const first = store.read();
    const second = store.read();

    // Assert
    expect(second).toBe(first);
  });

  it("should treat a corrupt record as absent", () => {
    // Arrange
    const storage = memoryStorage({ [DEVICE_PREFERENCES_KEY]: "{not json" });
    const store = createDevicePreferencesStore(() => storage);

    // Act
    const prefs = store.read();

    // Assert
    expect(prefs).toBeNull();
  });

  it("should keep working in memory when storage throws", () => {
    // Arrange
    const store = createDevicePreferencesStore(throwingStorage);
    const before = store.read();

    // Act
    store.seedFrom({ units: "imperial" });
    store.write({ units: "imperial", locale: "es" });

    // Assert
    expect(before).toBeNull();
    expect(store.read()).toEqual({ units: "imperial", locale: "es" });
  });

  it("should notify subscribers on write and stop after unsubscribe", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    // Act
    store.write({ units: "imperial" });
    unsubscribe();
    store.write({ units: "metric" });

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should notify subscribers when another tab changes the record", () => {
    // Arrange
    const storage = memoryStorage();
    const store = createDevicePreferencesStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    // Act
    window.dispatchEvent(
      new StorageEvent("storage", { key: DEVICE_PREFERENCES_KEY })
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "other-key" }));
    unsubscribe();

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
