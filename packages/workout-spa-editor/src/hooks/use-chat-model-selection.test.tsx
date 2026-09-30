/**
 * useChatModelSelection — switching a persisted conversation's provider
 * stores that provider's model as the override. A stored retired id must be
 * healed before it is stored, or the switch re-persists a certain 404.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useChatModelSelection } from "./use-chat-model-selection";

const PROFILE = "p1";
const CONVERSATION = "c1";

const PROVIDER: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  model: "claude-3-haiku-20240307",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
};

describe("useChatModelSelection", () => {
  it("should store the successor, not the provider's retired model", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.chatConversations.put({
      id: CONVERSATION,
      profileId: PROFILE,
      title: "Plan",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const wrap = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );
    const { result } = renderHook(
      () =>
        useChatModelSelection({
          profileId: PROFILE,
          activeId: CONVERSATION,
          isDraft: false,
          providers: [PROVIDER],
        }),
      { wrapper: wrap }
    );

    // Act
    act(() => result.current(PROVIDER.id));

    // Assert
    await waitFor(async () => {
      const stored = await persistence.chatConversations.get(
        PROFILE,
        CONVERSATION
      );
      expect(stored?.modelId).toBe("claude-haiku-4-5");
    });
  });
});
