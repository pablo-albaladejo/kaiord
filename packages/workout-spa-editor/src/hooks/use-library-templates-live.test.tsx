/**
 * Co-located test for `useLibraryTemplatesLive`.
 *
 * Production Dexie + fake-indexeddb (D5.1). Covers loading state,
 * resolved list, and re-fire on write through PersistencePort.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { KRD } from "../types/krd";
import type { WorkoutTemplate } from "../types/workout-library";
import { useLibraryTemplatesLive } from "./use-library-templates-live";

const TEMPLATE_UUID_1 = "00000000-0000-4000-8000-0000000000f1";
const TEMPLATE_UUID_2 = "00000000-0000-4000-8000-0000000000f2";

const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-30T00:00:00Z", sport: "cycling" },
});

const makeTemplate = (id: string, name: string): WorkoutTemplate => ({
  id,
  name,
  sport: "cycling",
  krd: makeKrd(),
  tags: [],
  createdAt: "2026-04-30T00:00:00Z",
  updatedAt: "2026-04-30T00:00:00Z",
});

const clear = () => db.table("templates").clear();

describe("useLibraryTemplatesLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return undefined while loading and resolves to the persisted list", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.templates.put(makeTemplate(TEMPLATE_UUID_1, "Tempo"));

    // Act
    const { result } = renderHook(() => useLibraryTemplatesLive());

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].id).toBe(TEMPLATE_UUID_1);
  });

  it("should re-fire when a new template is written through PersistencePort", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const { result } = renderHook(() => useLibraryTemplatesLive());
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    // Act
    await persistence.templates.put(makeTemplate(TEMPLATE_UUID_2, "VO2"));

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current?.[0].id).toBe(TEMPLATE_UUID_2);
    });
  });
});
