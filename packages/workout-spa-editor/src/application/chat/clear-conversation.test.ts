import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { clearConversation } from "./clear-conversation";

const PROFILE_A = "profile-a";
const PROFILE_B = "profile-b";
const CLEARED_AT = new Date("2026-06-13T12:00:00.000Z");

const msg = (id: string, profileId: string): ChatMessageRecord => ({
  id,
  profileId,
  role: "user",
  content: id,
  createdAt: "2026-06-13T10:00:00.000Z",
});

describe("clearConversation", () => {
  it("should delete the active profile's messages and keep other profiles", async () => {
    // Arrange
    const port = createInMemoryPersistence();
    await port.chatMessages.append(msg("a1", PROFILE_A));
    await port.chatMessages.append(msg("b1", PROFILE_B));

    // Act
    await clearConversation(port, PROFILE_A, () => CLEARED_AT);

    // Assert
    expect(await port.chatMessages.listByProfile(PROFILE_A)).toEqual([]);
    expect(
      (await port.chatMessages.listByProfile(PROFILE_B)).map((m) => m.id)
    ).toEqual(["b1"]);
  });

  it("should write one tombstone per deleted message", async () => {
    // Arrange
    const port = createInMemoryPersistence();
    await port.chatMessages.append(msg("a1", PROFILE_A));
    await port.chatMessages.append(msg("a2", PROFILE_A));

    // Act
    await clearConversation(port, PROFILE_A, () => CLEARED_AT);

    // Assert
    const tombstones = await port.tombstones.list();
    expect(tombstones).toHaveLength(2);
    expect(tombstones.every((t) => t.table === "chatMessages")).toBe(true);
    expect(tombstones.map((t) => t.id).sort()).toEqual(["a1", "a2"]);
  });

  it("should roll back the deletes and tombstones when a tombstone write fails", async () => {
    // Arrange
    const port = createInMemoryPersistence();
    await port.chatMessages.append(msg("a1", PROFILE_A));
    await port.chatMessages.append(msg("a2", PROFILE_A));
    port.tombstones.put = () => Promise.reject(new Error("disk full"));

    // Act
    const run = clearConversation(port, PROFILE_A, () => CLEARED_AT);

    // Assert
    await expect(run).rejects.toThrow("disk full");
    expect(
      (await port.chatMessages.listByProfile(PROFILE_A)).map((m) => m.id).sort()
    ).toEqual(["a1", "a2"]);
  });
});
