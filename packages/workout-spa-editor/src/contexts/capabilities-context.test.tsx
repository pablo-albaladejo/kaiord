import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { Profile } from "../types/profile";
import { CapabilitiesProvider, useCapabilities } from "./capabilities-context";

const PROFILE_ID = "00000000-0000-4000-8000-00000000ca01";
const OTHER_ID = "00000000-0000-4000-8000-00000000ca02";

const profile = (id: string): Profile => ({
  id,
  name: "Athlete",
  sportZones: {},
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
});

const TABLES = ["profiles", "meta", "userPreferences", "templates"];
const clear = () => Promise.all(TABLES.map((name) => db.table(name).clear()));

const seedAthlete = async (id = PROFILE_ID) => {
  await db.table("profiles").put(profile(id));
  await db.table("meta").put({ key: "activeProfileId", value: id });
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <CapabilitiesProvider>{children}</CapabilitiesProvider>
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

  it("should offer nothing a Capability owns outside the provider", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useCapabilities());

    // Assert
    expect(result.current.status).toBe("ready");
    expect(result.current.offers("nav", "library")).toBe(false);
  });
});
