/**
 * Dexie ChatConversationRepository contract tests. Mirrors the in-memory
 * contract so the two implementations stay observationally equivalent. Runs
 * against fake-indexeddb so no real IDB is required.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import { createDexieChatConversationRepository } from "./dexie-chat-conversation-repository";
import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-conv-repo-${suffix}-${Date.now()}-${Math.random()}`;

const PROFILE_A = "p-A";

const conv = (
  id: string,
  profileId: string,
  updatedAt: string
): ChatConversationRecord => ({
  id,
  profileId,
  title: id,
  createdAt: "2026-06-13T10:00:00.000Z",
  updatedAt,
});

describe("createDexieChatConversationRepository", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName("apply");
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should list a profile's conversations most-recently-updated first", async () => {
    // Arrange
    const repo = createDexieChatConversationRepository(db);
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.put(conv("c2", PROFILE_A, "2026-06-13T10:03:00.000Z"));
    await repo.put(conv("c3", PROFILE_A, "2026-06-13T10:02:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((c) => c.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("should return undefined for a foreign profile id", async () => {
    // Arrange
    const repo = createDexieChatConversationRepository(db);
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.get("other", "c1");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should delete one conversation by id", async () => {
    // Arrange
    const repo = createDexieChatConversationRepository(db);
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.put(conv("c2", PROFILE_A, "2026-06-13T10:02:00.000Z"));

    // Act
    await repo.delete("c1");

    // Assert
    expect((await repo.listByProfile(PROFILE_A)).map((c) => c.id)).toEqual([
      "c2",
    ]);
  });

  it("should bulk-delete every conversation for a profile", async () => {
    // Arrange
    const repo = createDexieChatConversationRepository(db);
    await repo.put(conv("c1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.put(conv("b1", "p-B", "2026-06-13T10:01:00.000Z"));

    // Act
    await repo.deleteByProfile(PROFILE_A);

    // Assert
    expect(await repo.listByProfile(PROFILE_A)).toEqual([]);
    expect((await repo.listByProfile("p-B")).map((c) => c.id)).toEqual(["b1"]);
  });
});
