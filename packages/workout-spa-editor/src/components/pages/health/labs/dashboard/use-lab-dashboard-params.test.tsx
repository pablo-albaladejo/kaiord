import "fake-indexeddb/auto";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../../../../adapters/dexie/dexie-database";
import type { UserPreferences } from "../../../../../types/user-preferences";
import { useLabDashboardParams } from "./use-lab-dashboard-params";

const PROFILE_ID = "labs-dashboard-p1";
const NOW = "2026-07-07T12:00:00.000Z";

const clearAll = () =>
  Promise.all([
    db.table("userPreferences").clear(),
    db.table("profiles").clear(),
  ]);

const seedProfile = () =>
  db.table("profiles").put({
    id: PROFILE_ID,
    name: "Labs Dashboard Athlete",
    linkedAccounts: [],
    sportZones: {},
    createdAt: NOW,
    updatedAt: NOW,
  });

describe("useLabDashboardParams", () => {
  beforeEach(async () => {
    await clearAll();
    await seedProfile();
  });
  afterEach(clearAll);

  it("should start with no pinned parameters", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useLabDashboardParams(PROFILE_ID));

    // Assert
    await waitFor(() => {
      expect(result.current.pinned).toEqual([]);
    });
  });

  it("should pin a parameter and persist it to userPreferences", async () => {
    // Arrange
    const { result } = renderHook(() => useLabDashboardParams(PROFILE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    await act(async () => {
      await result.current.toggle("glucose");
    });

    // Assert
    await waitFor(() => {
      expect(result.current.pinned).toEqual(["glucose"]);
    });
    const row = await db
      .table<UserPreferences>("userPreferences")
      .get(PROFILE_ID);
    expect(row?.labDashboardParams).toEqual(["glucose"]);
  });

  it("should unpin an already pinned parameter", async () => {
    // Arrange
    const { result } = renderHook(() => useLabDashboardParams(PROFILE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggle("glucose");
    });
    await waitFor(() => expect(result.current.pinned).toEqual(["glucose"]));

    // Act
    await act(async () => {
      await result.current.toggle("glucose");
    });

    // Assert
    await waitFor(() => {
      expect(result.current.pinned).toEqual([]);
    });
  });

  it("should keep other pinned parameters when pinning a new one", async () => {
    // Arrange
    const { result } = renderHook(() => useLabDashboardParams(PROFILE_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggle("glucose");
    });
    await waitFor(() => expect(result.current.pinned).toEqual(["glucose"]));

    // Act
    await act(async () => {
      await result.current.toggle("ferritin");
    });

    // Assert
    await waitFor(() => {
      expect(result.current.pinned).toEqual(["glucose", "ferritin"]);
    });
  });
});
