/**
 * useSyncAutoPush over the real (fake-indexeddb) database: a write to a
 * synced table must arm a debounced push. Nutrition rides the snapshot, so
 * logging an intake, saving a preset or editing the goal must push too.
 */
import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAppPersistence } from "../adapters/create-app-persistence";
import { db } from "../adapters/dexie/dexie-database";
import { logIntakeEntry } from "../application/nutrition/log-intake-entry.use-case";
import { saveIntakePreset } from "../application/nutrition/save-intake-preset.use-case";
import type * as AutoPush from "./use-auto-push";

const requestPush = vi.fn();
const tokens: unknown[] = [];

vi.mock("../contexts/sync-context", () => ({
  useSync: () => ({ connected: true, requestPush }),
}));

vi.mock("./use-auto-push", async (importOriginal) => {
  const original = await importOriginal<typeof AutoPush>();
  return {
    useAutoPush: (token: unknown, push: () => void) => {
      tokens.push(token);
      original.useAutoPush(token, push);
    },
  };
});

const { useSyncAutoPush } = await import("./use-sync-auto-push");

const NUTRITION = ["intakeEntries", "intakePresets", "energyTargets"];
const persistence = createAppPersistence(db);

/** Mounts the hook and waits until its first real token is the baseline. */
const mountSettled = async () => {
  renderHook(() => useSyncAutoPush());
  await waitFor(() => expect(tokens.at(-1)).not.toBe(""));
};

beforeEach(async () => {
  requestPush.mockReset();
  tokens.length = 0;
  for (const name of NUTRITION) await db.table(name).clear();
});

afterEach(async () => {
  for (const name of NUTRITION) await db.table(name).clear();
});

describe("useSyncAutoPush", () => {
  it("should schedule a push when an intake is logged", async () => {
    // Arrange
    await mountSettled();

    // Act
    await logIntakeEntry(
      { persistence, profileId: "p-1" },
      { date: "2026-10-11", kcal: 500, proteinG: 30, carbG: 60, fatG: 15 }
    );

    // Assert
    await waitFor(() => expect(requestPush).toHaveBeenCalled());
  });

  it("should schedule a push when an intake preset is saved", async () => {
    // Arrange
    await mountSettled();

    // Act
    await saveIntakePreset(
      { persistence, profileId: "p-1" },
      { label: "Oats", kcal: 350, proteinG: 12, carbG: 55, fatG: 7 }
    );

    // Assert
    await waitFor(() => expect(requestPush).toHaveBeenCalled());
  });

  it("should schedule a push when the nutrition goal is edited in place", async () => {
    // Arrange
    const goal = {
      profileId: "p-1",
      goalType: "fat_loss",
      startWeightKg: 80,
      targetWeightKg: 75,
      targetDate: "2027-01-01",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    } as const;
    await db.table("energyTargets").put(goal);
    await mountSettled();

    // Act
    await persistence.energyTargets.put({
      ...goal,
      targetWeightKg: 74,
      updatedAt: "2026-10-11T00:00:00.000Z",
    });

    // Assert
    await waitFor(() => expect(requestPush).toHaveBeenCalled());
  });
});
