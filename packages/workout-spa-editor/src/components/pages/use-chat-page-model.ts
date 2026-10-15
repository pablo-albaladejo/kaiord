import { useAiModelBindingsLive } from "../../hooks/use-ai-model-bindings-live";
import type { ChatConversationNav } from "../../hooks/use-chat-conversation-nav";
import { useChatModelSelection } from "../../hooks/use-chat-model-selection";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatModelPickerProps } from "../organisms/Chat/ChatModelPicker";
import { effectiveModel } from "../organisms/SettingsPanel/effective-models";
import { resolveActiveChatModel } from "./resolve-active-chat-model";
import { resolveChatModels } from "./resolve-chat-models";
import { useChatModelCleanup } from "./use-chat-model-cleanup";

type ChatPageModelArgs = {
  profileId: string | null;
  providers: LlmProviderConfig[];
  conversations: ChatConversationRecord[] | undefined;
  nav: Pick<ChatConversationNav, "activeId" | "isDraft">;
};

/**
 * What the active conversation runs and its model picker: the chat
 * resolution it follows when it has no model of its own (the one the AI
 * settings show), and the handlers that choose or clear its model.
 */
export const useChatPageModel = ({
  profileId,
  providers,
  conversations,
  nav,
}: ChatPageModelArgs) => {
  const bindings = useAiModelBindingsLive(profileId) ?? [];
  const active = conversations?.find((c) => c.id === nav.activeId);
  const draft = useChatModelCleanup({
    profileId,
    drafting: nav.isDraft || nav.activeId === null,
    active,
  });
  const selection = useChatModelSelection({
    profileId,
    activeId: nav.activeId,
    isDraft: nav.isDraft,
    providers,
  });
  const fallback = resolveChatModels(providers, bindings, draft);
  const model = resolveActiveChatModel(active, providers, fallback);
  const modelPicker: ChatModelPickerProps = {
    providers,
    running:
      model.provider && model.modelId
        ? { providerId: model.provider.id, modelId: model.modelId }
        : null,
    chosen: model.chosen,
    chatDefault: effectiveModel("chat", providers, bindings),
    onModelChoose: selection.choose,
    onModelFollow: selection.follow,
  };
  return { fallback, model, modelPicker };
};
