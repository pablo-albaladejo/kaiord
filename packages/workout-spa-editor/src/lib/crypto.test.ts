import { describe, expect, it } from "vitest";

import { decrypt, encrypt } from "./crypto";

describe("crypto", () => {
  const passphrase = "test-passphrase-123";

  it("should encrypt and decrypt a string round-trip", async () => {
    // Arrange
    const plaintext = "my-secret-api-key-sk-12345";
    const encrypted = await encrypt(plaintext, passphrase);

    // Act
    const decrypted = await decrypt(encrypted, passphrase);

    // Assert
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same input (random salt/iv)", async () => {
    // Arrange
    const plaintext = "same-input";
    const encrypted1 = await encrypt(plaintext, passphrase);

    // Act
    const encrypted2 = await encrypt(plaintext, passphrase);

    // Assert
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail decryption with wrong passphrase", async () => {
    // Arrange

    // Act
    const encrypted = await encrypt("secret", passphrase);

    // Assert
    await expect(decrypt(encrypted, "wrong-passphrase")).rejects.toThrow();
  });

  it("should handle empty string", async () => {
    // Arrange
    const encrypted = await encrypt("", passphrase);

    // Act
    const decrypted = await decrypt(encrypted, passphrase);

    // Assert
    expect(decrypted).toBe("");
  });

  it("should handle unicode content", async () => {
    // Arrange
    const plaintext = "contraseña-with-émojis-🏋️";
    const encrypted = await encrypt(plaintext, passphrase);

    // Act
    const decrypted = await decrypt(encrypted, passphrase);

    // Assert
    expect(decrypted).toBe(plaintext);
  });

  it("should produce base64 encoded output", async () => {
    // Arrange

    // Act
    const encrypted = await encrypt("test", passphrase);

    // Assert
    expect(() => atob(encrypted)).not.toThrow();
  });

  it("should round-trip when additionalData matches", async () => {
    // Arrange
    const aad = "manifest-context";
    const encrypted = await encrypt("secret", passphrase, aad);

    // Act
    const decrypted = await decrypt(encrypted, passphrase, aad);

    // Assert
    expect(decrypted).toBe("secret");
  });

  it("should fail decryption when additionalData differs", async () => {
    // Arrange
    const encrypted = await encrypt("secret", passphrase, "context-a");

    // Act

    // Assert
    await expect(decrypt(encrypted, passphrase, "context-b")).rejects.toThrow();
  });

  it("should fail decryption when additionalData is omitted on decrypt", async () => {
    // Arrange
    const encrypted = await encrypt("secret", passphrase, "context-a");

    // Act

    // Assert
    await expect(decrypt(encrypted, passphrase)).rejects.toThrow();
  });
});
