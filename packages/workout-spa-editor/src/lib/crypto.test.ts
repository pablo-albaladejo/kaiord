import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./crypto";

describe("crypto", () => {
  const passphrase = "test-passphrase-123";

  it("should encrypt and decrypt a string round-trip", async () => {
    const plaintext = "my-secret-api-key-sk-12345";

    const encrypted = await encrypt(plaintext, passphrase);
    const decrypted = await decrypt(encrypted, passphrase);

    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same input (random salt/iv)", async () => {
    const plaintext = "same-input";

    const encrypted1 = await encrypt(plaintext, passphrase);
    const encrypted2 = await encrypt(plaintext, passphrase);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail decryption with wrong passphrase", async () => {
    const encrypted = await encrypt("secret", passphrase);

    await expect(decrypt(encrypted, "wrong-passphrase")).rejects.toThrow();
  });

  it("should handle empty string", async () => {
    const encrypted = await encrypt("", passphrase);
    const decrypted = await decrypt(encrypted, passphrase);

    expect(decrypted).toBe("");
  });

  it("should handle unicode content", async () => {
    const plaintext = "contraseña-with-émojis-🏋️";

    const encrypted = await encrypt(plaintext, passphrase);
    const decrypted = await decrypt(encrypted, passphrase);

    expect(decrypted).toBe(plaintext);
  });

  it("should produce base64 encoded output", async () => {
    const encrypted = await encrypt("test", passphrase);

    expect(() => atob(encrypted)).not.toThrow();
  });
});
