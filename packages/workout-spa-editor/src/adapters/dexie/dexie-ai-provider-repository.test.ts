/**
 * Dexie AiProviderRepository: API keys are stored encrypted and read back in
 * plaintext. Runs against fake-indexeddb.
 */
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encrypt } from "../../lib/crypto";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";

const READS = 3;

const provider = (
  id: string,
  over: Partial<LlmProviderConfig> = {}
): LlmProviderConfig => ({
  id,
  type: "anthropic",
  apiKey: `sk-${id}`,
  label: id,
  isDefault: false,
  createdAt: Number(id.replace(/\D/g, "")),
  ...over,
});

describe("createDexieAiProviderRepository", () => {
  const db = sharedKaiordDatabase("aiProviders");
  let repo: ReturnType<typeof createDexieAiProviderRepository>;

  beforeEach(async () => {
    await db.open();
    await db.table("aiProviders").clear();
    repo = createDexieAiProviderRepository(db);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should store the key encrypted and read it back in plaintext", async () => {
    // Arrange
    await repo.put(provider("p1"));

    // Act
    const stored = await db.table("aiProviders").get("p1");
    const all = await repo.getAll();

    // Assert
    expect(stored.apiKey).not.toBe("sk-p1");
    expect(all.map((p) => p.apiKey)).toEqual(["sk-p1"]);
  });

  it("should not derive a key again to read back what it just stored", async () => {
    // Arrange
    // Each live reader re-reads every provider after every write. Deriving
    // the 100k-iteration PBKDF2 key for each of them per read made a save
    // cost 5 derivations per stored provider, and on a busy phone the new
    // account reached the list seconds after the form had closed.
    await repo.put(provider("p1"));
    await repo.put(provider("p2", { type: "openai" }));
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    for (let read = 0; read < READS; read++) await repo.getAll();

    // Assert
    expect(derive).not.toHaveBeenCalled();
  });

  it("should derive a key once for a row it did not write, however often it is read", async () => {
    // Arrange
    // A row restored from a backup or written by another tab arrives as
    // ciphertext this session has never seen.
    const { apiKey, ...rest } = provider("p3");
    await db
      .table("aiProviders")
      .put({ ...rest, apiKey: await encrypt(apiKey, "kaiord-spa-v1") });
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    const reads = [];
    for (let read = 0; read < READS; read++) reads.push(await repo.getAll());

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
    expect(reads.map((all) => all[0]?.apiKey)).toEqual([
      "sk-p3",
      "sk-p3",
      "sk-p3",
    ]);
  });
});
