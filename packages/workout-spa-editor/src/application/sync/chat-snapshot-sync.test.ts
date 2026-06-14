/**
 * Cross-device sync behaviour for the chat transcript. `chatMessages` rows
 * are append-only and keyed by `id`, so they merge through the generic
 * `mergeSnapshots` path with `createdAt` as the clock — no table-specific
 * merge code. A clear-conversation tombstone must suppress a message that
 * a stale remote snapshot still carries.
 */
import { describe, expect, it } from "vitest";

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { mergeSnapshots } from "./merge-snapshots";

const manifest = (exportedAt: string) => ({
  schemaVersion: 20,
  deviceId: "dev",
  exportedAt,
  encrypted: false,
});

const snap = (
  exportedAt: string,
  tables: Snapshot["tables"],
  tombstones: ReadonlyArray<Tombstone> = []
): Snapshot => ({ manifest: manifest(exportedAt), tables, tombstones });

const chatRow = (id: string, createdAt: string) => ({
  id,
  profileId: "p-1",
  role: "user",
  content: id,
  createdAt,
});

const chatRows = (merged: Snapshot) =>
  (merged.tables.chatMessages ?? []) as Array<{ id: string }>;

describe("chat transcript cross-device sync", () => {
  it("should union messages from both devices by id", () => {
    // Arrange
    const local = snap("2026-06-13T10:05:00.000Z", {
      chatMessages: [chatRow("m1", "2026-06-13T10:01:00.000Z")],
    });
    const remote = snap("2026-06-13T10:04:00.000Z", {
      chatMessages: [chatRow("m2", "2026-06-13T10:02:00.000Z")],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(
      chatRows(merged)
        .map((m) => m.id)
        .sort()
    ).toEqual(["m1", "m2"]);
  });

  it("should not resurrect a message cleared on one device via a tombstone", () => {
    // Arrange
    // Device A cleared m1 (tombstone, no row); device B is stale.
    const local = snap("2026-06-13T12:00:01.000Z", { chatMessages: [] }, [
      {
        table: "chatMessages",
        id: "m1",
        deletedAt: "2026-06-13T12:00:00.000Z",
      },
    ]);
    const remote = snap("2026-06-13T10:05:00.000Z", {
      chatMessages: [chatRow("m1", "2026-06-13T10:01:00.000Z")],
    });

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(chatRows(merged)).toEqual([]);
  });
});
