import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../contexts/persistence-context";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { useChatPageModel } from "./use-chat-page-model";

vi.mock("../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: vi.fn(() => []),
}));

const PROVIDER: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
};

const DRAFT = { providerId: "prov-1", modelId: "claude-opus-5" };

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

const renderModel = (nav: { activeId: string | null; isDraft: boolean }) =>
  renderHook(
    () =>
      useChatPageModel({
        profileId: "p1",
        providers: [PROVIDER],
        conversations: [],
        nav,
      }),
    { wrapper: wrap }
  );

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
});
