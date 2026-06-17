import { describe, expect, it, vi } from "vitest";

import { encryptSnapshot } from "../../lib/cloud-sync/snapshot-cipher";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { Snapshot } from "../../types/snapshot";
import { isEncryptedSnapshot } from "../../types/snapshot";
import { withEncryption } from "./encrypting-cloud-sync";

function makeSnapshot(): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "device-1",
      exportedAt: "2026-06-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: [{ id: "w1", name: "ride" }] },
    tombstones: [],
  };
}

describe("withEncryption", () => {
  it("should push cleartext when encryption is disabled", async () => {
    // Arrange
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const port = withEncryption(inner, {
      isEnabled: () => false,
      getPassphrase: () => "secret",
    });

    // Act
    await port.push(makeSnapshot(), null);

    // Assert
    expect(inner.state.snapshot?.manifest.encrypted).toBe(false);
    expect(isEncryptedSnapshot(inner.state.snapshot!)).toBe(false);
  });

  it("should push ciphertext when encryption is enabled", async () => {
    // Arrange
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: null,
      revision: null,
      pushCount: 0,
    });
    const port = withEncryption(inner, {
      isEnabled: () => true,
      getPassphrase: () => "secret",
    });

    // Act
    await port.push(makeSnapshot(), null);

    // Assert
    expect(isEncryptedSnapshot(inner.state.snapshot!)).toBe(true);
    expect(JSON.stringify(inner.state.snapshot)).not.toContain("ride");
  });

  it("should decrypt an encrypted remote snapshot on pull", async () => {
    // Arrange
    const encrypted = await encryptSnapshot(makeSnapshot(), "secret");
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: encrypted as unknown as Snapshot,
      revision: "rev-0",
      pushCount: 0,
    });
    const port = withEncryption(inner, {
      isEnabled: () => true,
      getPassphrase: () => "secret",
    });

    // Act
    const remote = await port.pull();

    // Assert
    expect(remote?.snapshot.manifest.encrypted).toBe(false);
    expect(remote?.snapshot.tables).toEqual(makeSnapshot().tables);
  });

  it("should block pull when the passphrase is missing for an encrypted snapshot", async () => {
    // Arrange
    const encrypted = await encryptSnapshot(makeSnapshot(), "secret");
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: encrypted as unknown as Snapshot,
      revision: "rev-0",
      pushCount: 0,
    });
    const getPassphrase = vi.fn(() => null);
    const port = withEncryption(inner, {
      isEnabled: () => true,
      getPassphrase,
    });

    // Act
    const attempt = port.pull();

    // Assert
    await expect(attempt).rejects.toThrow(/passphrase/i);
  });

  it("should reject a downgraded snapshot whose cleartext manifest carries a ciphertext", async () => {
    // Arrange
    const encrypted = await encryptSnapshot(makeSnapshot(), "secret");
    const downgraded = {
      ...encrypted,
      manifest: { ...encrypted.manifest, encrypted: false },
    };
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: downgraded as unknown as Snapshot,
      revision: "rev-0",
      pushCount: 0,
    });
    const port = withEncryption(inner, {
      isEnabled: () => true,
      getPassphrase: () => "secret",
    });

    // Act
    const attempt = port.pull();

    // Assert
    await expect(attempt).rejects.toThrow(/tampered/i);
  });

  it("should pass through a cleartext remote snapshot unchanged on pull", async () => {
    // Arrange
    const inner = createInMemoryCloudSyncPort({
      authenticated: true,
      snapshot: makeSnapshot(),
      revision: "rev-0",
      pushCount: 0,
    });
    const port = withEncryption(inner, {
      isEnabled: () => false,
      getPassphrase: () => null,
    });

    // Act
    const remote = await port.pull();

    // Assert
    expect(remote?.snapshot.tables).toEqual(makeSnapshot().tables);
  });
});
