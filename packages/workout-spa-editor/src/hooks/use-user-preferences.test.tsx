import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { UserPreferences } from "../types/user-preferences";
import { useUserPreferences } from "./use-user-preferences";

const seed = async (row: UserPreferences): Promise<void> => {
  await db.table<UserPreferences>("userPreferences").put(row);
};

const clear = () => db.table("userPreferences").clear();

describe("useUserPreferences", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return undefined when profileId is null", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() =>
      useUserPreferences({ profileId: null, defaultView: "grid" })
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it("should return the persisted row when one exists", async () => {
    // Arrange
    await seed({
      profileId: "p1",
      calendarView: "list",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });

    // Act
    const { result } = renderHook(() =>
      useUserPreferences({ profileId: "p1", defaultView: "grid" })
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.calendarView).toBe("list");
    });
  });

  it("should return the viewport-derived default when no row exists", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() =>
      useUserPreferences({ profileId: "p1", defaultView: "list" })
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.calendarView).toBe("list");
    });
  });

  it("should re-evaluate on profileId change without leaking previous-profile value", async () => {
    // Arrange
    await seed({
      profileId: "p1",
      calendarView: "list",
      updatedAt: "2026-04-30T10:00:00.000Z",
    });
    const { result, rerender } = renderHook(
      ({ profileId }) => useUserPreferences({ profileId, defaultView: "grid" }),
      { initialProps: { profileId: "p1" as string | null } }
    );
    await waitFor(() => {
      expect(result.current?.calendarView).toBe("list");
    });

    // Act
    rerender({ profileId: "p2" });

    // Assert
    await waitFor(() => {
      // p2 has no row → falls back to defaultView (grid), not p1's list
      expect(result.current?.calendarView).toBe("grid");
      expect(result.current?.profileId).toBe("p2");
    });
  });

  it("should re-fire when the underlying row is written", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useUserPreferences({ profileId: "p1", defaultView: "grid" })
    );
    await waitFor(() => {
      expect(result.current?.calendarView).toBe("grid"); // default
    });

    // Act
    await seed({
      profileId: "p1",
      calendarView: "list",
      updatedAt: "2026-05-01T12:00:00.000Z",
    });

    // Assert
    await waitFor(() => {
      expect(result.current?.calendarView).toBe("list");
    });
  });
});
