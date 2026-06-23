/**
 * Co-located test for `useChatMessagesLive`. Verifies the live query
 * resolves the active conversation's transcript in chronological order and
 * re-fires when a new message is appended (the "transcript survives
 * reload / updates live" read contract). Runs against fake-indexeddb.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import { useChatMessagesLive } from "./use-chat-messages-live";

const PROFILE = "p-chat-live";
const CONVERSATION = "c-chat-live";

const message = (id: string, createdAt: string): ChatMessageRecord => ({
  id,
  profileId: PROFILE,
  conversationId: CONVERSATION,
  role: "user",
  content: id,
  createdAt,
});

const clear = () => db.table("chatMessages").clear();

describe("useChatMessagesLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve the conversation's messages in order and re-fire on append", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(
      message("m1", "2026-06-13T10:01:00.000Z")
    );
    const { result } = renderHook(() =>
      useChatMessagesLive(PROFILE, CONVERSATION)
    );
    await waitFor(() => {
      expect(result.current?.map((m) => m.id)).toEqual(["m1"]);
    });

    // Act
    await persistence.chatMessages.append(
      message("m2", "2026-06-13T10:02:00.000Z")
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.map((m) => m.id)).toEqual(["m1", "m2"]);
    });
  });

  it("should return an empty transcript for a null conversation id", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useChatMessagesLive(PROFILE, null));

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
