/**
 * Forward migration to v22 — additive `aiModelBindings` table plus a
 * default-binding backfill from the current default provider. Opening
 * KaiordDatabase from an older seed runs every forward migration and lands at
 * head; the backfill seeds one `default` binding per profile.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v22-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 19;
const SCHEMA_HEAD = 30;
const STORES_SEED = {
  profiles: "id",
  aiProviders: "id, createdAt",
  meta: "key",
  tombstones: "[table+id], table, deletedAt",
} as const;

type SeedRows = {
  profiles?: ReadonlyArray<Record<string, unknown>>;
  aiProviders?: ReadonlyArray<Record<string, unknown>>;
};

const seed = async (name: string, rows: SeedRows): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  if (rows.profiles?.length)
    await older.table("profiles").bulkAdd([...rows.profiles]);
  if (rows.aiProviders?.length)
    await older.table("aiProviders").bulkAdd([...rows.aiProviders]);
  older.close();
};

const PROFILE = { id: "p-1", name: "P" };
const PROVIDER_DEFAULT = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "enc",
  model: "claude-sonnet-4-6",
  label: "A",
  isDefault: true,
  createdAt: 1,
};
const PROVIDER_OTHER = {
  ...PROVIDER_DEFAULT,
  id: "prov-2",
  model: "gpt-4o",
  isDefault: false,
  createdAt: 2,
};

describe("Dexie aiModelBindings (v22) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seed(name, { profiles: [PROFILE], aiProviders: [PROVIDER_DEFAULT] });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should backfill a default binding from the default provider", async () => {
    // Arrange
    await seed(name, {
      profiles: [PROFILE],
      aiProviders: [PROVIDER_OTHER, PROVIDER_DEFAULT],
    });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const binding = await db.table("aiModelBindings").get(["p-1", "default"]);
    db.close();

    // Assert
    expect(binding).toMatchObject({
      profileId: "p-1",
      purpose: "default",
      providerId: "prov-1",
      modelId: "claude-sonnet-4-6",
    });
  });

  it("should leave the bindings store empty when no providers exist", async () => {
    // Arrange
    await seed(name, { profiles: [PROFILE], aiProviders: [] });

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("aiModelBindings").count();
    db.close();

    // Assert
    expect(count).toBe(0);
  });
});
