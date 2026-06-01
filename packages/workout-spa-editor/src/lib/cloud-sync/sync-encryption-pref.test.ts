import { afterEach, describe, expect, it } from "vitest";

import {
  isEncryptionEnabled,
  markPlaintextWarningSeen,
  setEncryptionEnabled,
  wasPlaintextWarningSeen,
} from "./sync-encryption-pref";

afterEach(() => {
  localStorage.clear();
});

describe("sync-encryption-pref", () => {
  it("should default to encryption disabled", () => {
    // Arrange

    // Act
    const enabled = isEncryptionEnabled();

    // Assert
    expect(enabled).toBe(false);
  });

  it("should persist the encryption toggle across reads", () => {
    // Arrange
    setEncryptionEnabled(true);

    // Act
    const enabled = isEncryptionEnabled();

    // Assert
    expect(enabled).toBe(true);
  });

  it("should turn the encryption toggle back off", () => {
    // Arrange
    setEncryptionEnabled(true);

    // Act
    setEncryptionEnabled(false);

    // Assert
    expect(isEncryptionEnabled()).toBe(false);
  });

  it("should report the plaintext warning as unseen by default", () => {
    // Arrange

    // Act
    const seen = wasPlaintextWarningSeen();

    // Assert
    expect(seen).toBe(false);
  });

  it("should record the plaintext warning as seen once marked", () => {
    // Arrange
    markPlaintextWarningSeen();

    // Act
    const seen = wasPlaintextWarningSeen();

    // Assert
    expect(seen).toBe(true);
  });
});
