import { beforeEach, describe, expect, it } from "vitest";

import { createSecureStorage } from "./secure-storage";

describe("secure-storage", () => {
  const passphrase = "test-pass";

  beforeEach(() => {
    localStorage.clear();
  });

  it("should store and retrieve a value", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);
    await storage.set("api-key", "sk-12345");

    // Act
    const value = await storage.get("api-key");

    // Assert
    expect(value).toBe("sk-12345");
  });

  it("should return null for missing key", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);

    // Act
    const value = await storage.get("nonexistent");

    // Assert
    expect(value).toBeNull();
  });

  it("should store encrypted data in localStorage (not plaintext)", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);
    await storage.set("secret", "my-api-key");

    // Act
    const raw = localStorage.getItem("kaiord_secure_secret");

    // Assert
    expect(raw).not.toBeNull();
    expect(raw).not.toBe("my-api-key");
    expect(raw).not.toContain("my-api-key");
  });

  it("should remove a key", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);
    await storage.set("key", "value");

    // Act
    storage.remove("key");

    // Assert
    expect(storage.has("key")).toBe(false);
    expect(await storage.get("key")).toBeNull();
  });

  it("should report has() correctly", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);
    expect(storage.has("key")).toBe(false);

    // Act
    await storage.set("key", "value");

    // Assert
    expect(storage.has("key")).toBe(true);
  });

  it("should clear all secure keys", async () => {
    // Arrange
    const storage = createSecureStorage(passphrase);
    await storage.set("key1", "v1");
    await storage.set("key2", "v2");
    localStorage.setItem("unrelated", "keep");

    // Act
    storage.clearAll();

    // Assert
    expect(storage.has("key1")).toBe(false);
    expect(storage.has("key2")).toBe(false);
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("should fail to decrypt with wrong passphrase", async () => {
    // Arrange
    const storage1 = createSecureStorage("correct-pass");
    const storage2 = createSecureStorage("wrong-pass");

    // Act
    await storage1.set("key", "secret");

    // Assert
    await expect(storage2.get("key")).rejects.toThrow();
  });
});
