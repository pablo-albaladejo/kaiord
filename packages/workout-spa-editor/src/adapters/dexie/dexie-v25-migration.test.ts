/**
 * Forward migration to v25 — multi-conversation chat. Seeding a v23 database
 * with flat `chatMessages` and opening `KaiordDatabase` runs `applyV25Upgrade`:
 * every profile with messages gets one seeded "Conversation 1" and each
 * message is backfilled with that conversation's id. Profiles without messages
 * get no conversation.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { seededConversationId } from "./dexie-v25-migration";

const dbName = (suffix: string) =>
  `kaiord-test-v25-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 23;
const SCHEMA_HEAD = 30;
const STORES_SEED = {
  profiles: "id, updatedAt",
  chatMessages: "id, profileId, [profileId+createdAt]",
  meta: "key",
  tombstones: "[table+id], table, deletedAt",
} as const;

type Row = Record<string, unknown>;

const msg = (id: string, profileId: string, createdAt: string): Row => ({
  id,
  profileId,
  role: "user",
  content: `m-${id}`,
  createdAt,
});

const seed = async (name: string, messages: ReadonlyArray<Row>) => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  await older.table("profiles").bulkAdd([{ id: "p-1" }, { id: "p-2" }]);
  if (messages.length) await older.table("chatMessages").bulkAdd([...messages]);
  older.close();
};

describe("Dexie chatConversations (v25) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to head version 29", async () => {
    // Arrange
    await seed(name, []);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should bucket each profile's messages into one seeded conversation", async () => {
    // Arrange
    await seed(name, [
      msg("a", "p-1", "2026-06-10T10:00:00.000Z"),
      msg("b", "p-1", "2026-06-12T10:00:00.000Z"),
      msg("c", "p-2", "2026-06-11T10:00:00.000Z"),
    ]);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const conversations = await db.table("chatConversations").toArray();
    const messages = await db.table("chatMessages").toArray();
    db.close();

    // Assert
    expect(conversations).toHaveLength(2);
    const p1 = conversations.find((c) => c.profileId === "p-1");
    expect(p1).toMatchObject({
      id: seededConversationId("p-1"),
      title: "Conversation 1",
      createdAt: "2026-06-12T10:00:00.000Z",
      updatedAt: "2026-06-12T10:00:00.000Z",
    });
    expect(messages.every((m) => m.conversationId)).toBe(true);
    expect(messages.filter((m) => m.profileId === "p-1")).toHaveLength(2);
    expect(
      messages.every(
        (m) => m.conversationId === seededConversationId(m.profileId)
      )
    ).toBe(true);
  });

  it("should preserve every message through the backfill", async () => {
    // Arrange
    const seeded = [
      msg("a", "p-1", "2026-06-10T10:00:00.000Z"),
      msg("b", "p-1", "2026-06-12T10:00:00.000Z"),
      msg("c", "p-2", "2026-06-11T10:00:00.000Z"),
    ];
    await seed(name, seeded);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("chatMessages").count();
    db.close();

    // Assert
    expect(count).toBe(seeded.length);
  });

  it("should create no conversation for a profile with no messages", async () => {
    // Arrange
    await seed(name, [msg("a", "p-1", "2026-06-10T10:00:00.000Z")]);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const conversations = await db.table("chatConversations").toArray();
    db.close();

    // Assert
    expect(conversations.map((c) => c.profileId)).toEqual(["p-1"]);
  });
});
