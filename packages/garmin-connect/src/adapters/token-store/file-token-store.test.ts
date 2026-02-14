import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createFileTokenStore } from "./file-token-store";

describe("createFileTokenStore", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should save and load tokens", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "tokens.json");
    const store = createFileTokenStore(filePath);

    const tokens = { oauth1: { token: "t1" }, oauth2: { token: "t2" } };
    await store.save(tokens);

    const loaded = await store.load();

    expect(loaded).toEqual(tokens);
  });

  it("should return null when file does not exist", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "nonexistent.json");
    const store = createFileTokenStore(filePath);

    const loaded = await store.load();

    expect(loaded).toBeNull();
  });

  it("should clear tokens", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "tokens.json");
    const store = createFileTokenStore(filePath);

    await store.save({ test: true });
    await store.clear();
    const loaded = await store.load();

    expect(loaded).toBeNull();
  });

  it("should not throw when clearing nonexistent file", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "kaiord-test-"));
    const filePath = join(tmpDir, "nonexistent.json");
    const store = createFileTokenStore(filePath);

    await expect(store.clear()).resolves.toBeUndefined();
  });
});
