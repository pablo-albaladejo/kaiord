import { describe, expect, it } from "vitest";

import type { Snapshot } from "../../types/snapshot";
import { isEncryptedSnapshot } from "../../types/snapshot";
import { decryptSnapshot, encryptSnapshot } from "./snapshot-cipher";

function makeSnapshot(): Snapshot {
  return {
    manifest: {
      schemaVersion: 19,
      deviceId: "device-1",
      exportedAt: "2026-06-01T00:00:00.000Z",
      encrypted: false,
    },
    tables: { workouts: [{ id: "w1", name: "ride" }] },
    tombstones: [
      { table: "workouts", id: "w0", deletedAt: "2026-05-01T00:00:00.000Z" },
    ],
  };
}

describe("snapshot-cipher", () => {
  it("should produce an encrypted snapshot with a cleartext manifest", async () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const encrypted = await encryptSnapshot(snapshot, "correct horse");

    // Assert
    expect(isEncryptedSnapshot(encrypted)).toBe(true);
    expect(encrypted.manifest.encrypted).toBe(true);
    expect(encrypted.manifest.schemaVersion).toBe(
      snapshot.manifest.schemaVersion
    );
    expect(typeof encrypted.ciphertext).toBe("string");
  });

  it("should not leak table contents into the ciphertext payload", async () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const encrypted = await encryptSnapshot(snapshot, "correct horse");

    // Assert
    expect(encrypted.ciphertext).not.toContain("ride");
    expect(JSON.stringify(encrypted)).not.toContain("ride");
  });

  it("should round-trip when decrypted with the correct passphrase", async () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const encrypted = await encryptSnapshot(snapshot, "correct horse");
    const decrypted = await decryptSnapshot(encrypted, "correct horse");

    // Assert
    expect(decrypted.tables).toEqual(snapshot.tables);
    expect(decrypted.tombstones).toEqual(snapshot.tombstones);
    expect(decrypted.manifest.encrypted).toBe(false);
  });

  it("should fail to decrypt with the wrong passphrase", async () => {
    // Arrange
    const snapshot = makeSnapshot();
    const encrypted = await encryptSnapshot(snapshot, "correct horse");

    // Act
    const attempt = decryptSnapshot(encrypted, "battery staple");

    // Assert
    await expect(attempt).rejects.toThrow();
  });
});
