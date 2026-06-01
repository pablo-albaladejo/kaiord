import { describe, expect, it, vi } from "vitest";

import type { RemoteSnapshot, Snapshot } from "../../types/snapshot";
import type { DriveRest } from "./drive-rest";
import type { GisAuth } from "./gis-token-client";
import { createGoogleDriveCloudSyncAdapter } from "./google-drive-cloud-sync-adapter";

function snapshot(): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "dev",
      exportedAt: "2026-01-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: {},
    tombstones: [],
  };
}

function fakeAuth(authenticated: boolean): GisAuth {
  return {
    isAuthenticated: () => authenticated,
    authenticate: vi.fn(async () => {}),
    getAccessToken: () => (authenticated ? "tok" : null),
  };
}

describe("createGoogleDriveCloudSyncAdapter", () => {
  it("should delegate isAuthenticated to the auth layer", () => {
    // Arrange
    const adapter = createGoogleDriveCloudSyncAdapter({
      auth: fakeAuth(true),
      rest: { download: vi.fn(), upload: vi.fn() } as unknown as DriveRest,
    });

    // Act
    const result = adapter.isAuthenticated();

    // Assert
    expect(result).toBe(true);
  });

  it("should return null from pull when no remote file exists", async () => {
    // Arrange
    const rest: DriveRest = {
      download: vi.fn(async () => null),
      upload: vi.fn(),
    };
    const adapter = createGoogleDriveCloudSyncAdapter({
      auth: fakeAuth(true),
      rest,
    });

    // Act
    const result = await adapter.pull();

    // Assert
    expect(result).toBeNull();
  });

  it("should return snapshot and revision from pull when the file exists", async () => {
    // Arrange
    const remote: RemoteSnapshot = {
      snapshot: snapshot(),
      headRevisionId: "rev-5",
    };
    const rest: DriveRest = {
      download: vi.fn(async () => remote),
      upload: vi.fn(),
    };
    const adapter = createGoogleDriveCloudSyncAdapter({
      auth: fakeAuth(true),
      rest,
    });

    // Act
    const result = await adapter.pull();

    // Assert
    expect(result).toEqual(remote);
  });

  it("should return the new revision from push", async () => {
    // Arrange
    const rest: DriveRest = {
      download: vi.fn(),
      upload: vi.fn(async () => "rev-6"),
    };
    const adapter = createGoogleDriveCloudSyncAdapter({
      auth: fakeAuth(true),
      rest,
    });

    // Act
    const revision = await adapter.push(snapshot(), "rev-5");

    // Assert
    expect(revision).toBe("rev-6");
  });
});
