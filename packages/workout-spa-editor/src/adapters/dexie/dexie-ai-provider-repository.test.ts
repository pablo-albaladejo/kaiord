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
import { createDexieClearAllTables } from "./dexie-clear-all-tables";

const READS = 3;
const TAMPERED_TAIL = "AAAA";

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

  const foreignRow = async (id: string, cipher?: string) => {
    const { apiKey, ...rest } = provider(id);
    const stored = cipher ?? (await encrypt(apiKey, "kaiord-spa-v1"));
    await db.table("aiProviders").put({ ...rest, apiKey: stored });
    return stored;
  };

  const storedCipher = async (id: string): Promise<string> =>
    (await db.table("aiProviders").get(id)).apiKey;

  it("should derive a key once when several readers miss together", async () => {
    // Arrange
    // On a cold load every live reader reads at once: caching only the
    // result let each of them miss and derive its own key for every row.
    await foreignRow("p4");
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    const reads = await Promise.all([
      repo.getAll(),
      repo.getAll(),
      repo.getAll(),
    ]);

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
    expect(reads.map((all) => all[0]?.apiKey)).toEqual([
      "sk-p4",
      "sk-p4",
      "sk-p4",
    ]);
  });

  it("should forget the key of a removed provider", async () => {
    // Arrange
    await repo.put(provider("p5"));
    const cipher = await storedCipher("p5");
    await repo.delete("p5");
    await foreignRow("p5", cipher);
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    await repo.getAll();

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it("should forget the old key when a provider's key is replaced", async () => {
    // Arrange
    await repo.put(provider("p6"));
    const oldCipher = await storedCipher("p6");
    await repo.put(provider("p6", { apiKey: "sk-new" }));
    await db.table("aiProviders").clear();
    await foreignRow("p7", oldCipher);
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    await repo.getAll();

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it("should forget a key whose row another writer removed", async () => {
    // Arrange
    // Another tab, an import or a wipe can remove a row without passing
    // through this repository; the next read keeps only what it saw.
    await repo.put(provider("p8"));
    const cipher = await storedCipher("p8");
    await db.table("aiProviders").clear();
    await repo.getAll();
    await foreignRow("p8", cipher);
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    await repo.getAll();

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it("should forget every key when all data is deleted", async () => {
    // Arrange
    // "Delete all my data" empties every store; no key it held may outlive it.
    await repo.put(provider("p10"));
    const cipher = await storedCipher("p10");
    await createDexieClearAllTables(db)();
    await foreignRow("p10", cipher);
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    await repo.getById("p10");

    // Assert
    expect(derive).toHaveBeenCalledTimes(1);
  });

  it("should reject a tampered key on every read", async () => {
    // Arrange
    const cipher = await foreignRow("p9");
    const tampered = `${cipher.slice(0, -TAMPERED_TAIL.length)}${TAMPERED_TAIL}`;
    await db
      .table("aiProviders")
      .put({ ...(await db.table("aiProviders").get("p9")), apiKey: tampered });
    const derive = vi.spyOn(crypto.subtle, "deriveKey");

    // Act
    const first = repo.getAll();
    await expect(first).rejects.toThrow();
    const second = repo.getAll();

    // Assert
    await expect(second).rejects.toThrow();
    expect(derive).toHaveBeenCalledTimes(2);
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
