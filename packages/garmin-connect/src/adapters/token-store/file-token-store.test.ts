import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createFileTokenStore } from "./file-token-store";

describe("createFileTokenStore", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should save and load tokens", async () => {
    // Arrange
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "tokens.json");
    const store = createFileTokenStore(filePath);
    const tokens = { oauth1: { token: "t1" }, oauth2: { token: "t2" } };
    await store.save(tokens);

    // Act
    const loaded = await store.load();

    // Assert
    expect(loaded).toEqual(tokens);
  });

  it("should return null when file does not exist", async () => {
    // Arrange
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "nonexistent.json");
    const store = createFileTokenStore(filePath);

    // Act
    const loaded = await store.load();

    // Assert
    expect(loaded).toBeNull();
  });

  it("should clear tokens", async () => {
    // Arrange
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "tokens.json");
    const store = createFileTokenStore(filePath);
    await store.save({ test: true });
    await store.clear();

    // Act
    const loaded = await store.load();

    // Assert
    expect(loaded).toBeNull();
  });

  it("should not throw when clearing nonexistent file", async () => {
    // Arrange
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "nonexistent.json");

    // Act
    const store = createFileTokenStore(filePath);

    // Assert
    await expect(store.clear()).resolves.toBeUndefined();
  });
});
