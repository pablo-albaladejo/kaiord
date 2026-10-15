/**
 * useChatModelSelection — a persisted conversation stores the chosen provider
 * and model as its own override (healed past retirement, never blank) and
 * "Same as main" clears it; an unsaved draft keeps the choice in volatile
 * runtime state until its first message stamps it.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import type { PersistencePort } from "../ports/persistence-port";
import { useAiRuntimeStore } from "../store/ai-runtime-store";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { useChatModelSelection } from "./use-chat-model-selection";

const PROFILE = "p1";
const CONVERSATION = "c1";

const PROVIDER: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "sk-test",
  label: "Claude",
  isDefault: true,
  createdAt: 0,
};

const setup = async (isDraft: boolean, override = false) => {
  const persistence: PersistencePort = createInMemoryPersistence();
  await persistence.chatConversations.put({
    id: CONVERSATION,
    profileId: PROFILE,
    title: "Plan",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...(override ? { providerId: PROVIDER.id, modelId: "claude-opus-5" } : {}),
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
        isDraft,
        providers: [PROVIDER],
      }),
    { wrapper: wrap }
  );
  const stored = () => persistence.chatConversations.get(PROFILE, CONVERSATION);
  return { result, stored };
};

describe("useChatModelSelection", () => {
  beforeEach(() => {
    useAiRuntimeStore.setState({ chatDraftModel: null });
  });

  it("should store the chosen model, healed past retirement", async () => {
    // Arrange
    const { result, stored } = await setup(false);

    // Act
    act(() =>
      result.current.choose({
        providerId: PROVIDER.id,
        modelId: "claude-3-haiku-20240307",
      })
    );

    // Assert
    await waitFor(async () => {
      const row = await stored();
      expect(row?.providerId).toBe(PROVIDER.id);
      expect(row?.modelId).toBe("claude-haiku-4-5");
    });
  });

  it("should clear the conversation's own model when it follows the main one", async () => {
    // Arrange
    const { result, stored } = await setup(false, true);

    // Act
    act(() => result.current.follow());

    // Assert
    await waitFor(async () => {
      const row = await stored();
      expect(row?.providerId).toBeUndefined();
      expect(row?.modelId).toBeUndefined();
    });
  });

  it("should keep a draft's choice in runtime state, not in the database", async () => {
    // Arrange
    const { result, stored } = await setup(true);
    const choice = { providerId: PROVIDER.id, modelId: "claude-opus-5" };

    // Act
    act(() => result.current.choose(choice));

    // Assert
    expect(useAiRuntimeStore.getState().chatDraftModel).toEqual({
      profileId: PROFILE,
      ...choice,
    });
    expect((await stored())?.modelId).toBeUndefined();
  });

  it("should drop a draft's choice when it follows the main model", async () => {
    // Arrange
    const { result } = await setup(true);
    useAiRuntimeStore.setState({
      chatDraftModel: {
        profileId: PROFILE,
        providerId: PROVIDER.id,
        modelId: "claude-opus-5",
      },
    });

    // Act
    act(() => result.current.follow());

    // Assert
    expect(useAiRuntimeStore.getState().chatDraftModel).toBeNull();
  });

  it("should never store a blank model id", async () => {
    // Arrange
    const draft = await setup(true);
    const saved = await setup(false, true);

    // Act
    act(() =>
      draft.result.current.choose({ providerId: "prov-1", modelId: " " })
    );
    act(() =>
      saved.result.current.choose({ providerId: "prov-1", modelId: "" })
    );

    // Assert
    expect(useAiRuntimeStore.getState().chatDraftModel).toBeNull();
    expect((await saved.stored())?.modelId).toBe("claude-opus-5");
  });
});
