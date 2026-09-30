/**
 * The file download of a persisted workout resolves pace zones against the
 * profile that owns the record — the one its Garmin push uses — not the
 * profile that happens to be active.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import {
  freshProfile,
  paceZoneKrd,
  RUN_THRESHOLD,
  withThreshold,
} from "../test-utils/pace-zone-fixtures";
import { exportGcnFile } from "../utils/export-workout-formats";
import { exportRecordGcn } from "./garmin-record-gcn";
import { useExportProfile } from "./use-export-profile";

const OTHER_THRESHOLD = 240;

const clear = () =>
  Promise.all([db.table("profiles").clear(), db.table("meta").clear()]);

const seed = async () => {
  const persistence = createDexiePersistence(db);
  const owner = await withThreshold(freshProfile(), "running", RUN_THRESHOLD);
  const active = await withThreshold(
    freshProfile(),
    "running",
    OTHER_THRESHOLD
  );
  await persistence.profiles.put(owner);
  await persistence.profiles.put(active);
  await persistence.profiles.setActiveId(active.id);
  return { persistence, owner, active };
};

describe("useExportProfile", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve the record's owning profile, not the active one", async () => {
    // Arrange
    const { owner } = await seed();

    // Act
    const { result } = renderHook(() => useExportProfile(owner.id));

    // Assert
    await waitFor(() => expect(result.current?.id).toBe(owner.id));
  });

  it("should resolve the active profile for a workout without a record", async () => {
    // Arrange
    const { active } = await seed();

    // Act
    const { result } = renderHook(() => useExportProfile(undefined));

    // Assert
    await waitFor(() => expect(result.current?.id).toBe(active.id));
  });

  it("should download the same GCN the Garmin push of the record sends", async () => {
    // Arrange
    const { persistence, owner } = await seed();
    const krd = paceZoneKrd();
    const { result } = renderHook(() => useExportProfile(owner.id));
    await waitFor(() => expect(result.current?.id).toBe(owner.id));

    // Act
    const bytes = await exportGcnFile(krd, undefined, result.current);

    // Assert
    const downloaded = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    expect(downloaded).toEqual(
      await exportRecordGcn(krd, owner.id, persistence.profiles)
    );
  });
});
