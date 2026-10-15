import { useAiModelBindingsLive } from "../../hooks/use-ai-model-bindings-live";
import type { ChatConversationNav } from "../../hooks/use-chat-conversation-nav";
import { useChatModelSelection } from "../../hooks/use-chat-model-selection";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { ChatModelPickerProps } from "../organisms/Chat/ChatModelPicker";
import { effectiveModel } from "../organisms/SettingsPanel/effective-models";
import { resolveActiveChatModel } from "./resolve-active-chat-model";
import { resolveChatModels } from "./resolve-chat-models";

type ChatPageModelArgs = {
  profileId: string | null;
  providers: LlmProviderConfig[];
  conversations: ChatConversationRecord[] | undefined;
  nav: Pick<ChatConversationNav, "activeId" | "isDraft">;
};

/**
 * What the active conversation runs and its model picker: the chat
 * resolution it follows when it has no model of its own (the one the AI
 * settings show), and the handlers that choose or clear its model. A draft's choice applies only while no
 * persisted conversation is open.
 */
export const useChatPageModel = ({
  profileId,
  providers,
  conversations,
  nav,
}: ChatPageModelArgs) => {
  const bindings = useAiModelBindingsLive(profileId) ?? [];
  const draft = useAiRuntimeStore((s) => s.chatDraftModel);
  const selection = useChatModelSelection({
    profileId,
    activeId: nav.activeId,
    isDraft: nav.isDraft,
    providers,
  });
  const fallback = resolveChatModels(
    providers,
    bindings,
    nav.isDraft || !nav.activeId ? draft : null
  );
  const active = conversations?.find((c) => c.id === nav.activeId);
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
