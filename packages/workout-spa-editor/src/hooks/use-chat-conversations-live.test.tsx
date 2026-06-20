/**
 * Co-located test for `useChatConversationsLive`. Verifies the live query
 * resolves a profile's conversations most-recently-updated first and re-fires
 * when a conversation is written. Runs against fake-indexeddb.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import { useChatConversationsLive } from "./use-chat-conversations-live";

const PROFILE = "p-conv-live";

const conv = (id: string, updatedAt: string): ChatConversationRecord => ({
  id,
  profileId: PROFILE,
  title: id,
  createdAt: "2026-06-13T10:00:00.000Z",
  updatedAt,
});

const clear = () => db.table("chatConversations").clear();

describe("useChatConversationsLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve conversations newest-updated first and re-fire on write", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatConversations.put(
      conv("c1", "2026-06-13T10:01:00.000Z")
    );
    const { result } = renderHook(() => useChatConversationsLive(PROFILE));
    await waitFor(() => {
      expect(result.current?.map((c) => c.id)).toEqual(["c1"]);
    });

    // Act
    await persistence.chatConversations.put(
      conv("c2", "2026-06-13T10:05:00.000Z")
    );

    // Assert
    await waitFor(() => {
      expect(result.current?.map((c) => c.id)).toEqual(["c2", "c1"]);
    });
  });

  it("should return an empty list for a null profile id", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useChatConversationsLive(null));

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
