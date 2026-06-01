import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { SyncProvider } from "../../../contexts/sync-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import type { CloudSyncPort } from "../../../ports/cloud-sync-port";
import { createInMemoryCloudSyncPort } from "../../../test-utils/in-memory-cloud-sync-port";
import {
  createInMemorySnapshotPort,
  type InMemorySnapshotState,
} from "../../../test-utils/in-memory-snapshot-port";
import { SyncTab } from "./SyncTab";

function makeSnapshotState(): InMemorySnapshotState {
  return { schemaVersion: 19, tables: { workouts: [] }, tombstones: [] };
}

function wrap(cloud: CloudSyncPort, children: ReactNode) {
  const snapshotPort = createInMemorySnapshotPort(makeSnapshotState());
  return (
    <ToastContextProvider>
      <SyncProvider cloud={cloud} snapshotPort={snapshotPort} deviceId="d1">
        {children}
      </SyncProvider>
    </ToastContextProvider>
  );
}

describe("SyncTab", () => {
  it("should show a connect control when no account is connected", () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort();

    // Act
    render(wrap(cloud, <SyncTab />));

    // Assert
    expect(
      screen.getByRole("button", { name: /connect google account/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("sync-status")).toHaveTextContent(
      "Not connected"
    );
  });

  it("should switch to connected controls after connecting", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort();
    const user = userEvent.setup();
    render(wrap(cloud, <SyncTab />));

    // Act
    await user.click(
      screen.getByRole("button", { name: /connect google account/i })
    );

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sync now/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /disconnect/i })
    ).toBeInTheDocument();
  });

  it("should run a sync cycle when Sync now is clicked", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const user = userEvent.setup();
    render(wrap(cloud, <SyncTab />));

    // Act
    await user.click(screen.getByRole("button", { name: /sync now/i }));

    // Assert
    await waitFor(() => {
      expect(cloud.state.pushCount).toBeGreaterThan(0);
    });
  });

  it("should stay usable and show an offline status when a sync fails", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    cloud.pull = async () => {
      throw new Error("offline");
    };
    const user = userEvent.setup();
    render(wrap(cloud, <SyncTab />));

    // Act
    await user.click(screen.getByRole("button", { name: /sync now/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("sync-status")).toHaveTextContent(
        /working offline/i
      );
    });
    expect(
      screen.getByRole("button", { name: /sync now/i })
    ).toBeInTheDocument();
  });

  it("should stop showing sync controls after disconnect", async () => {
    // Arrange
    const cloud = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const user = userEvent.setup();
    render(wrap(cloud, <SyncTab />));

    // Act
    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /connect google account/i })
      ).toBeInTheDocument();
    });
  });
});
