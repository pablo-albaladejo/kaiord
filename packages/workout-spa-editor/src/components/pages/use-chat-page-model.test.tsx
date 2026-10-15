import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../contexts/persistence-context";
import type { PersistencePort } from "../../ports/persistence-port";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import { useChatPageModel } from "./use-chat-page-model";

vi.mock("../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: vi.fn(() => []),
}));
vi.mock("../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: vi.fn(() => [PROVIDER]),
}));

const PROVIDER: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
};

const DRAFT = {
  profileId: "p1",
  providerId: "prov-1",
  modelId: "claude-opus-5",
};

type Nav = { activeId: string | null; isDraft: boolean };
type Opts = {
  profileId?: string;
  providers?: LlmProviderConfig[];
  conversations?: ChatConversationRecord[];
  persistence?: PersistencePort;
};

const renderModel = (nav: Nav, opts: Opts = {}) => {
  const persistence = opts.persistence ?? createInMemoryPersistence();
  const wrap = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  return renderHook(
    () =>
      useChatPageModel({
        profileId: opts.profileId ?? "p1",
        providers: opts.providers ?? [PROVIDER],
        conversations: opts.conversations ?? [],
        nav,
      }),
    { wrapper: wrap }
  );
};

describe("useChatPageModel", () => {
  beforeEach(() => {
    useAiRuntimeStore.setState({ chatDraftModel: DRAFT });
  });

  it("should run the draft's own choice while the draft is open", () => {
    // Arrange
    const nav = { activeId: "d1", isDraft: true };

    // Act
    const { result } = renderModel(nav);

    // Assert
    expect(result.current.model.modelId).toBe("claude-opus-5");
    expect(useAiRuntimeStore.getState().chatDraftModel).toEqual(DRAFT);
  });

  it("should drop the draft's choice once a saved conversation is open, so the next draft follows the main model", () => {
    // Arrange
    const nav = { activeId: "c1", isDraft: false };

    // Act
    renderModel(nav);

    // Assert
    expect(useAiRuntimeStore.getState().chatDraftModel).toBeNull();
  });

  it("should not hand one athlete's draft choice to another athlete", () => {
    // Arrange
    const nav = { activeId: "d1", isDraft: true };

    // Act
    const { result } = renderModel(nav, { profileId: "p2" });

    // Assert
    expect(result.current.model.modelId).toBe("claude-sonnet-5");
    expect(result.current.modelPicker.chosen).toBe(false);
    expect(useAiRuntimeStore.getState().chatDraftModel).toBeNull();
  });

  it("should clear a conversation's model whose account was removed", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const dead: ChatConversationRecord = {
      id: "c1",
      profileId: "p1",
      title: "Plan",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      providerId: "removed",
      modelId: "gpt-5",
    };
    await persistence.chatConversations.put(dead);
    const nav = { activeId: "c1", isDraft: false };

    // Act
    renderModel(nav, { conversations: [dead], persistence });

    // Assert
    await waitFor(async () => {
      const row = await persistence.chatConversations.get("p1", "c1");
      expect(row?.providerId).toBeUndefined();
      expect(row?.modelId).toBeUndefined();
    });
  });

  it("should keep a conversation's model whose account is only missing its key", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const keyless: ChatConversationRecord = {
      id: "c1",
      profileId: "p1",
      title: "Plan",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      providerId: "prov-1",
      modelId: "claude-opus-5",
    };
    await persistence.chatConversations.put(keyless);
    const nav = { activeId: "c1", isDraft: false };

    // Act
    const ready = [{ ...PROVIDER, id: "prov-2" }];
    renderModel(nav, {
      providers: ready,
      conversations: [keyless],
      persistence,
    });
    await new Promise((r) => setTimeout(r, 0));

    // Assert
    const row = await persistence.chatConversations.get("p1", "c1");
    expect(row?.modelId).toBe("claude-opus-5");
  });
});
