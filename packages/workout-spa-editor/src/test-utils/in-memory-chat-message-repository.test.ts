import { describe, it, expect } from "vitest";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import { createInMemoryChatMessageRepository } from "./in-memory-chat-message-repository";

const msg = (
  id: string,
  profileId: string,
  createdAt: string
): ChatMessageRecord => ({
  id,
  profileId,
  role: "user",
  content: id,
  createdAt,
});

const PROFILE_A = "profile-a";
const PROFILE_B = "profile-b";

describe("createInMemoryChatMessageRepository", () => {
  it("should list a profile's messages in ascending createdAt order", async () => {
    // Arrange
    const repo = createInMemoryChatMessageRepository();
    await repo.append(msg("m2", PROFILE_A, "2026-06-13T10:02:00.000Z"));
    await repo.append(msg("m1", PROFILE_A, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("should return only the most recent N messages when a limit is given", async () => {
    // Arrange
    const repo = createInMemoryChatMessageRepository();
    await repo.append(msg("m1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(msg("m2", PROFILE_A, "2026-06-13T10:02:00.000Z"));
    await repo.append(msg("m3", PROFILE_A, "2026-06-13T10:03:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A, 2);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("should isolate messages by profile", async () => {
    // Arrange
    const repo = createInMemoryChatMessageRepository();
    await repo.append(msg("a1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(msg("b1", PROFILE_B, "2026-06-13T10:01:00.000Z"));

    // Act
    const result = await repo.listByProfile(PROFILE_A);

    // Assert
    expect(result.map((m) => m.id)).toEqual(["a1"]);
  });

  it("should delete only the target profile's messages on deleteByProfile", async () => {
    // Arrange
    const repo = createInMemoryChatMessageRepository();
    await repo.append(msg("a1", PROFILE_A, "2026-06-13T10:01:00.000Z"));
    await repo.append(msg("b1", PROFILE_B, "2026-06-13T10:01:00.000Z"));

    // Act
    await repo.deleteByProfile(PROFILE_A);

    // Assert
    expect(await repo.listByProfile(PROFILE_A)).toEqual([]);
    expect((await repo.listByProfile(PROFILE_B)).map((m) => m.id)).toEqual([
      "b1",
    ]);
  });
});
