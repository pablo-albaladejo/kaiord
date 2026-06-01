import { afterEach, describe, expect, it } from "vitest";

import {
  clearSyncPassphrase,
  getSyncPassphrase,
  setSyncPassphrase,
} from "./encryption-runtime";

afterEach(() => {
  clearSyncPassphrase();
});

describe("encryption-runtime", () => {
  it("should return null before any passphrase is set", () => {
    // Arrange

    // Act
    const passphrase = getSyncPassphrase();

    // Assert
    expect(passphrase).toBeNull();
  });

  it("should hold the passphrase in memory after it is set", () => {
    // Arrange
    setSyncPassphrase("correct horse");

    // Act
    const passphrase = getSyncPassphrase();

    // Assert
    expect(passphrase).toBe("correct horse");
  });

  it("should clear the passphrase back to null", () => {
    // Arrange
    setSyncPassphrase("correct horse");

    // Act
    clearSyncPassphrase();

    // Assert
    expect(getSyncPassphrase()).toBeNull();
  });
});
