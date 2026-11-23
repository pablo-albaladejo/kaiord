import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { Profile } from "../types/profile";
import { CapabilitiesProvider, useCapabilities } from "./capabilities-context";
import { PersistenceProvider } from "./persistence-context";

const PROFILE_ID = "00000000-0000-4000-8000-00000000ca01";
const OTHER_ID = "00000000-0000-4000-8000-00000000ca02";

const profile = (id: string): Profile => ({
  id,
  name: "Athlete",
  sportZones: {},
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
});

const TABLES = [
  "profiles",
  "meta",
  "userPreferences",
  "capabilityDecisions",
  "templates",
  "dataTypeSourcePolicy",
];
const clear = () => Promise.all(TABLES.map((name) => db.table(name).clear()));

const seedAthlete = async (id = PROFILE_ID) => {
  await db.table("profiles").put(profile(id));
  await db.table("meta").put({ key: "activeProfileId", value: id });
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createDexiePersistence(db)}>
    <CapabilitiesProvider>{children}</CapabilitiesProvider>
  </PersistenceProvider>
);

const renderReady = async () => {
  const hook = renderHook(() => useCapabilities(), { wrapper });
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
};

describe("CapabilitiesProvider", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should keep Templates off for a new athlete", async () => {
    // Arrange
    await seedAthlete();

    // Act
    const { result } = await renderReady();

    // Assert
    expect(result.current.isOn("templates")).toBe(false);
    expect(result.current.offers("route", "/library")).toBe(false);
  });

  it("should turn Templates on for an athlete who already has templates", async () => {
    // Arrange
    await seedAthlete();
    await db.table("templates").put({ id: "t1", name: "Tempo", sport: "run" });

    // Act
    const { result } = await renderReady();

    // Assert
    await waitFor(() => expect(result.current.isOn("templates")).toBe(true));
  });

  it("should activate and deactivate Templates without touching its data", async () => {
    // Arrange
    await seedAthlete();
    await db.table("templates").put({ id: "t1", name: "Tempo", sport: "run" });
    const { result } = await renderReady();

    // Act
    await act(() => result.current.set("templates", false));
    await waitFor(() => expect(result.current.isOn("templates")).toBe(false));
    await act(() => result.current.set("templates", true));

    // Assert
    await waitFor(() => expect(result.current.isOn("templates")).toBe(true));
    expect(await db.table("templates").count()).toBe(1);
  });

  it("should keep one athlete's decision off another athlete", async () => {
    // Arrange
    await db.table("profiles").put(profile(OTHER_ID));
    await seedAthlete();
    const { result } = await renderReady();
    await act(() => result.current.set("templates", true));

    // Act
    await act(() =>
      db.table("meta").put({ key: "activeProfileId", value: OTHER_ID })
    );

    // Assert
    await waitFor(() => expect(result.current.isOn("templates")).toBe(false));
  });

  it("should throw when read outside its provider", () => {
    // Arrange
    const outside = () => renderHook(() => useCapabilities());

    // Act
    const read = () => outside();

    // Assert
    expect(read).toThrow(/CapabilitiesProvider/);
  });

  it("should show a decision to a reader mounted after it was made", async () => {
    // Arrange
    await seedAthlete();
    const { result: first } = await renderReady();

    // Act
    await act(() => first.current.set("templates", true));
    const second = renderHook(() => useCapabilities(), { wrapper });

    // Assert
    await waitFor(() => expect(first.current.isOn("templates")).toBe(true));
    await waitFor(() =>
      expect(second.result.current.isOn("templates")).toBe(true)
    );
  });

  it("should keep the Authority matrix off and its Tool unoffered for a new athlete", async () => {
    // Arrange
    await seedAthlete();

    // Act
    const { result } = await renderReady();

    // Assert
    expect(result.current.isOn("authority-matrix")).toBe(false);
    expect(result.current.offers("settings", "authority")).toBe(false);
    expect(result.current.offers("tool", "set_data_route")).toBe(false);
  });

  it("should turn the Authority matrix on for an athlete who already chose an Authority", async () => {
    // Arrange
    await seedAthlete();
    await db.table("dataTypeSourcePolicy").put({
      profileId: PROFILE_ID,
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });

    // Act
    const { result } = await renderReady();

    // Assert
    expect(result.current.isOn("authority-matrix")).toBe(true);
    expect(result.current.offers("tool", "set_data_route")).toBe(true);
  });

  it("should not turn the Authority matrix on from another athlete's choice", async () => {
    // Arrange
    await seedAthlete();
    await db.table("dataTypeSourcePolicy").put({
      profileId: OTHER_ID,
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });

    // Act
    const { result } = await renderReady();

    // Assert
    expect(result.current.isOn("authority-matrix")).toBe(false);
  });
});
