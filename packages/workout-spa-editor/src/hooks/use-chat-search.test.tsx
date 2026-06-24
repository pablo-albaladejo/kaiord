/**
 * Co-located test for `useChatSearch`. Verifies idle behavior for an ineffective
 * query, debounced results once the query is effective (messages lazily loaded),
 * result updates on query change, live reflection of messages appended during an
 * active search, and a return to idle when cleared. Runs against fake-indexeddb.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";
import { useChatSearch } from "./use-chat-search";

const PROFILE = "p-search";

const conversations: ChatConversationRecord[] = [
  {
    id: "c1",
    profileId: PROFILE,
    title: "Plan",
    createdAt: "2026-06-13T10:00:00.000Z",
    updatedAt: "2026-06-13T10:00:00.000Z",
  },
];

const message = (id: string, content: string): ChatMessageRecord => ({
  id,
  profileId: PROFILE,
  conversationId: "c1",
  role: "user",
  content,
  createdAt: `2026-06-13T10:0${id.slice(-1)}:00.000Z`,
});

const clear = async () => {
  await db.table("chatMessages").clear();
};

describe("useChatSearch", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should stay idle with no results for an ineffective query", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(message("m1", "umbral funcional"));

    // Act
    const { result } = renderHook(() => useChatSearch(PROFILE, conversations));

    // Assert
    expect(result.current.active).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it("should produce debounced results once the query is effective", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(message("m1", "trabajar el umbral"));
    const { result } = renderHook(() => useChatSearch(PROFILE, conversations));

    // Act
    act(() => result.current.setQuery("umbral"));

    // Assert
    expect(result.current.active).toBe(true);
    await waitFor(() => {
      expect(result.current.results.map((r) => r.conversationId)).toEqual([
        "c1",
      ]);
    });
  });

  it("should update results when the query changes", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(message("m1", "hablar de vo2max"));
    const { result } = renderHook(() => useChatSearch(PROFILE, conversations));
    act(() => result.current.setQuery("umbral"));
    await waitFor(() => expect(result.current.results).toEqual([]));

    // Act
    act(() => result.current.setQuery("vo2"));

    // Assert
    await waitFor(() => {
      expect(result.current.results.map((r) => r.conversationId)).toEqual([
        "c1",
      ]);
    });
  });

  it("should reflect messages appended while the search is active", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(message("m1", "hablar de cadencia"));
    const { result } = renderHook(() => useChatSearch(PROFILE, conversations));
    act(() => result.current.setQuery("umbral"));
    await waitFor(() => expect(result.current.results).toEqual([]));

    // Act
    await act(async () => {
      await persistence.chatMessages.append(message("m2", "subir el umbral"));
    });

    // Assert
    await waitFor(() => {
      expect(result.current.results.map((r) => r.conversationId)).toEqual([
        "c1",
      ]);
    });
  });

  it("should return to idle when the query is cleared", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.chatMessages.append(message("m1", "el umbral de hoy"));
    const { result } = renderHook(() => useChatSearch(PROFILE, conversations));
    act(() => result.current.setQuery("umbral"));
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    // Act
    act(() => result.current.setQuery(""));

    // Assert
    expect(result.current.active).toBe(false);
    await waitFor(() => expect(result.current.results).toEqual([]));
  });
});
