/**
 * A download clicked before any live query settles still exports against
 * the record's owning profile: the profile is read when the athlete
 * clicks, not from a render-time snapshot that starts out empty.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import {
  freshProfile,
  RUN_THRESHOLD,
  withThreshold,
} from "../../../test-utils/pace-zone-fixtures";
import type { KRD } from "../../../types/krd";
import { useSaveWorkout } from "./use-save-workout";

const mockExportWorkout = vi.fn();

vi.mock("../../../utils/export-workout", () => ({
  exportWorkout: (...args: unknown[]) => mockExportWorkout(...args) as unknown,
  downloadWorkout: vi.fn(),
}));

const KRD_STUB = { extensions: {} } as unknown as KRD;

const clear = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

describe("useSaveWorkout", () => {
  beforeEach(async () => {
    await clear();
    mockExportWorkout.mockResolvedValue(new Uint8Array());
  });
  afterEach(clear);

  it("should export against the owning profile when clicked before any query settles", async () => {
    // Arrange
    const owner = await withThreshold(freshProfile(), "running", RUN_THRESHOLD);
    await createDexiePersistence(db).profiles.put(owner);
    const { result } = renderHook(() => useSaveWorkout(KRD_STUB, owner.id));

    act(() => result.current.setSelectedFormat("gcn"));

    // Act
    await act(async () => {
      await result.current.handleSave();
    });

    // Assert
    expect(mockExportWorkout).toHaveBeenCalledWith(
      KRD_STUB,
      "gcn",
      expect.any(Function),
      owner
    );
  });

  it("should export against the active profile for a workout without a record", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const active = await withThreshold(
      freshProfile(),
      "running",
      RUN_THRESHOLD
    );
    await persistence.profiles.put(active);
    await persistence.profiles.setActiveId(active.id);
    const { result } = renderHook(() => useSaveWorkout(KRD_STUB));

    act(() => result.current.setSelectedFormat("gcn"));

    // Act
    await act(async () => {
      await result.current.handleSave();
    });

    // Assert
    expect(mockExportWorkout).toHaveBeenCalledWith(
      KRD_STUB,
      "gcn",
      expect.any(Function),
      active
    );
  });
});
