/**
 * Dexie ChatMessageRepository contract tests. Mirrors the in-memory
 * contract so the two implementations stay observationally equivalent.
 * Runs against fake-indexeddb so no real IDB is required.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { createDexieChatMessageRepository } from "./dexie-chat-message-repository";
import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-chat-repo-${suffix}-${Date.now()}-${Math.random()}`;

const PROFILE_A = "p-A";
const PROFILE_B = "p-B";

const seed = (
  id: string,
  profileId: string,
  createdAt: string,
  conversationId = "conv-default"
): ChatMessageRecord => ({
  id,
  profileId,
  conversationId,
  role: "user",
  content: id,
  createdAt,
});

describe("createDexieChatMessageRepository", () => {
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

  it("should round-trip append and list in chronological order", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("m2", PROFILE_A, "2026-06-13T10:02:00.000Z"));
    await repo.append(seed("m1", PROFILE_A, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("should return the most recent N messages when limited", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("m1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(seed("m2", PROFILE_A, "2026-06-13T10:02:00.000Z"));
    await repo.append(seed("m3", PROFILE_A, "2026-06-13T10:03:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A, 2);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("should isolate reads by profile", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("a1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(seed("b1", PROFILE_B, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["a1"]);
  });

  it("should delete only the target profile on deleteByProfile", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("a1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(seed("b1", PROFILE_B, "2026-06-13T10:01:00.000Z"));

    // Act
    await repo.deleteByProfile(PROFILE_A);

    // Assert
    expect(await repo.listByProfile(PROFILE_A)).toEqual([]);
    expect((await repo.listByProfile(PROFILE_B)).map((m) => m.id)).toEqual([
      "b1",
    ]);
  });

  it("should list only the conversation's messages in order", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("c1b", PROFILE_A, "2026-06-13T10:02:00.000Z", "c1"));
    await repo.append(seed("c1a", PROFILE_A, "2026-06-13T10:01:00.000Z", "c1"));
    await repo.append(seed("c2a", PROFILE_A, "2026-06-13T10:03:00.000Z", "c2"));

    // Act
    const result = await repo.listByConversation(PROFILE_A, "c1");

    // Assert
    expect(result.map((m) => m.id)).toEqual(["c1a", "c1b"]);
  });

  it("should delete only the target conversation on deleteByConversation", async () => {
    // Arrange
    const repo = createDexieChatMessageRepository(db);
    await repo.append(seed("c1a", PROFILE_A, "2026-06-13T10:01:00.000Z", "c1"));
    await repo.append(seed("c2a", PROFILE_A, "2026-06-13T10:02:00.000Z", "c2"));

    // Act
    await repo.deleteByConversation("c1");

    // Assert
    expect(await repo.listByConversation(PROFILE_A, "c1")).toEqual([]);
    expect(
      (await repo.listByConversation(PROFILE_A, "c2")).map((m) => m.id)
    ).toEqual(["c2a"]);
  });
});
