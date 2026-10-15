/**
 * A binding cleared ("Same as main model") or removed with its provider on
 * one device must not come back from another device that still holds it,
 * while a later re-set on any device still wins over the tombstone.
 */
import { describe, expect, it } from "vitest";

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { mergeSnapshots } from "./merge-snapshots";
import { createLiveRowMerge } from "./merge-table-rows";

const snap = (
  exportedAt: string,
  rows: unknown[],
  tombstones: Tombstone[] = []
): Snapshot => ({
  manifest: { schemaVersion: 22, deviceId: "d", exportedAt, encrypted: false },
  tables: { aiModelBindings: rows },
  tombstones,
});

const binding = (modelId: string, updatedAt: string) => ({
  profileId: "p-1",
  purpose: "chat",
  providerId: "prov-1",
  modelId,
  updatedAt,
});

const cleared = (deletedAt: string): Tombstone => ({
  table: "aiModelBindings",
  id: "p-1:chat",
  deletedAt,
  profileId: "p-1",
});

describe("model binding deletes across devices", () => {
  it("should not resurrect a binding device A cleared after B's copy", () => {
    // Arrange
    const a = snap(
      "2026-10-15T10:05:00.000Z",
      [],
      [cleared("2026-10-15T10:03:00.000Z")]
    );
    const b = snap("2026-10-15T10:04:00.000Z", [
      binding("old", "2026-10-15T10:01:00.000Z"),
    ]);

    // Act
    const merged = mergeSnapshots(a, b);

    // Assert
    expect(merged.tables.aiModelBindings).toEqual([]);
  });

  it("should let a later re-set on another device win over the tombstone", () => {
    // Arrange
    const a = snap(
      "2026-10-15T10:05:00.000Z",
      [],
      [cleared("2026-10-15T10:03:00.000Z")]
    );
    const b = snap("2026-10-15T10:06:00.000Z", [
      binding("new", "2026-10-15T10:04:00.000Z"),
    ]);

    // Act
    const merged = mergeSnapshots(a, b);

    // Assert
    expect(merged.tables.aiModelBindings).toEqual([
      binding("new", "2026-10-15T10:04:00.000Z"),
    ]);
  });

  it("should drop an incoming binding the live tombstone deletes on import", () => {
    // Arrange
    const merge = createLiveRowMerge([cleared("2026-10-15T10:03:00.000Z")], {
      aiModelBindings: [],
    })("aiModelBindings");

    // Act
    const rows = merge?.([], [binding("old", "2026-10-15T10:01:00.000Z")]);

    // Assert
    expect(rows).toEqual([]);
  });
});
