/**
 * Cross-device sync for per-profile model bindings. `aiModelBindings` rows use
 * a composite primary key `[profileId+purpose]` (registered in
 * `merge-record-key`) and an `updatedAt` clock, so `mergeSnapshots` keeps the
 * newest binding per purpose and never collapses distinct purposes/profiles
 * into a single key.
 */
import { describe, expect, it } from "vitest";

import type { Snapshot } from "../../types/snapshot";
import { mergeSnapshots } from "./merge-snapshots";

const manifest = (exportedAt: string) => ({
  schemaVersion: 22,
  deviceId: "dev",
  exportedAt,
  encrypted: false,
});

const snap = (exportedAt: string, tables: Snapshot["tables"]): Snapshot => ({
  manifest: manifest(exportedAt),
  tables,
  tombstones: [],
});

const binding = (
  purpose: string,
  modelId: string,
  updatedAt: string,
  profileId = "p-1"
) => ({ profileId, purpose, providerId: "prov-1", modelId, updatedAt });

const bindings = (merged: Snapshot) =>
  (merged.tables.aiModelBindings ?? []) as Array<{
    purpose: string;
    modelId: string;
    profileId: string;
  }>;

describe("model bindings cross-device sync", () => {
  it("should keep the newest binding per purpose by updatedAt", () => {
    // Arrange
    const local = snap("2026-06-15T10:05:00.000Z", {
      aiModelBindings: [binding("chat", "old", "2026-06-15T10:01:00.000Z")],
    });
    const remote = snap("2026-06-15T10:04:00.000Z", {
      aiModelBindings: [binding("chat", "new", "2026-06-15T10:02:00.000Z")],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(bindings(merged)).toHaveLength(1);
    expect(bindings(merged)[0]?.modelId).toBe("new");
  });

  it("should keep distinct purposes and profiles as separate rows", () => {
    // Arrange
    const local = snap("2026-06-15T10:05:00.000Z", {
      aiModelBindings: [
        binding("default", "a", "2026-06-15T10:01:00.000Z", "p-1"),
        binding("chat", "b", "2026-06-15T10:01:00.000Z", "p-1"),
      ],
    });
    const remote = snap("2026-06-15T10:04:00.000Z", {
      aiModelBindings: [
        binding("default", "c", "2026-06-15T10:00:00.000Z", "p-2"),
      ],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(
      bindings(merged)
        .map((b) => `${b.profileId}:${b.purpose}`)
        .sort()
    ).toEqual(["p-1:chat", "p-1:default", "p-2:default"]);
  });
});
