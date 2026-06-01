import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createInMemoryCloudSyncPort } from "../test-utils/in-memory-cloud-sync-port";
import {
  createInMemorySnapshotPort,
  type InMemorySnapshotState,
} from "../test-utils/in-memory-snapshot-port";
import type { Snapshot } from "../types/snapshot";
import { SyncProvider, useSync } from "./sync-context";

function makeSnapshotState(): InMemorySnapshotState {
  return { schemaVersion: 19, tables: { workouts: [] }, tombstones: [] };
}

function remoteSnapshot(): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "remote",
      exportedAt: "2030-01-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: [{ id: "w1", updatedAt: "2030-01-01T00:00:00.000Z" }] },
    tombstones: [],
  };
}

function Probe() {
  const sync = useSync();
  return <div data-testid="status">{sync.status}</div>;
}

describe("SyncProvider", () => {
  it("should pull and apply a remote snapshot on app open when connected", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: remoteSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });
    const state = makeSnapshotState();
    const snapshotPort = createInMemorySnapshotPort(state);

    // Act
    render(
      <SyncProvider cloud={cloud} snapshotPort={snapshotPort} deviceId="d1">
        <Probe />
      </SyncProvider>
    );

    // Assert
    await waitFor(() => {
      expect(state.tables.workouts).toEqual([
        { id: "w1", updatedAt: "2030-01-01T00:00:00.000Z" },
      ]);
    });
  });

  it("should NOT pull on open when no account is connected", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort();
    const state = makeSnapshotState();
    const snapshotPort = createInMemorySnapshotPort(state);

    // Act
    render(
      <SyncProvider cloud={cloud} snapshotPort={snapshotPort} deviceId="d1">
        <Probe />
      </SyncProvider>
    );

    // Assert
    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(state.tables.workouts).toEqual([]);
  });

  it("should throw when useSync is read outside the provider", () => {
    // Arrange
    const renderOutside = () => render(<Probe />);

    // Act
    // (render happens in Assert via the thrown error)

    // Assert
    expect(renderOutside).toThrow();
  });
});
