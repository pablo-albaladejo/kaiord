import "fake-indexeddb/auto";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { DEVICE_PREFERENCES_KEY } from "../lib/device-preferences";
import { useDevicePreferences } from "./use-device-preferences";

const NOW = "2026-10-12T10:00:00.000Z";

const seedActiveProfile = async (prefs: Record<string, unknown>) => {
  await db.table("profiles").put({
    id: "p1",
    name: "p1",
    linkedAccounts: [],
    sportZones: {},
    createdAt: NOW,
    updatedAt: NOW,
  });
  await db.table("meta").put({ key: "activeProfileId", value: "p1" });
  await db
    .table("userPreferences")
    .put({ profileId: "p1", calendarView: "grid", ...prefs, updatedAt: NOW });
};

const storedRecord = () =>
  JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_KEY) ?? "null");

const clearAll = async () => {
  for (const t of ["profiles", "meta", "userPreferences"]) {
    await db.table(t).clear();
  }
  localStorage.clear();
};

describe("useDevicePreferences", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should seed the device from the active profile on first boot", async () => {
    // Arrange
    await seedActiveProfile({
      units: "imperial",
      locale: "es",
      notificationsEnabled: true,
    });

    // Act
    const { result } = renderHook(() => useDevicePreferences());

    // Assert
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.prefs).toEqual({
      units: "imperial",
      locale: "es",
      notificationsEnabled: true,
    });
    expect(storedRecord()).toEqual({
      units: "imperial",
      locale: "es",
      notificationsEnabled: true,
    });
  });

  it("should ignore the profile when the device already has preferences", async () => {
    // Arrange
    localStorage.setItem(
      DEVICE_PREFERENCES_KEY,
      JSON.stringify({ units: "metric", locale: "en" })
    );
    await seedActiveProfile({ units: "imperial", locale: "es" });

    // Act
    const { result } = renderHook(() => useDevicePreferences());

    // Assert
    expect(result.current.ready).toBe(true);
    expect(result.current.prefs).toEqual({ units: "metric", locale: "en" });
    expect(storedRecord()).toEqual({ units: "metric", locale: "en" });
  });

  it("should merge an update over the current values", async () => {
    // Arrange
    await seedActiveProfile({ units: "imperial", locale: "es" });
    const { result } = renderHook(() => useDevicePreferences());
    await waitFor(() => expect(result.current.ready).toBe(true));

    // Act
    act(() => result.current.update({ units: "metric" }));

    // Assert
    expect(result.current.prefs).toEqual({ units: "metric", locale: "es" });
    expect(storedRecord()).toEqual({ units: "metric", locale: "es" });
  });

  it("should leave a profile without preferences on the defaults", async () => {
    // Arrange
    await seedActiveProfile({});

    // Act
    const { result } = renderHook(() => useDevicePreferences());

    // Assert
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.prefs).toEqual({});
  });
});
