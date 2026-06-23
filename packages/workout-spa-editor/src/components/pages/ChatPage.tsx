/**
 * ChatPage — routed `/chat` and `/chat/:conversationId` destination.
 *
 * Renders the active profile's conversation list alongside the active
 * conversation's thread. The active conversation is resolved from the route
 * (deep link) or an in-memory draft; a draft persists on its first message.
 * Model resolution prefers the conversation's own override, falling back to
 * the page-level chat resolution. No provider configured → settings link.
 */
import { usePersistence } from "../../contexts/persistence-context";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import { useChatConversationActions } from "../../hooks/use-chat-conversation-actions";
import { useChatConversationNav } from "../../hooks/use-chat-conversation-nav";
import { useChatConversationsLive } from "../../hooks/use-chat-conversations-live";
import { useChatMessagesLive } from "../../hooks/use-chat-messages-live";
import { useChatModelSelection } from "../../hooks/use-chat-model-selection";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import { ChatHeader } from "../organisms/Chat/ChatHeader";
import { ChatWorkspace } from "../organisms/Chat/ChatWorkspace";
import { CreateProvidersEmpty } from "./CreateWorkout/CreateProvidersEmpty";
import { resolveActiveChatModel } from "./resolve-active-chat-model";
import { resolveChatModels } from "./resolve-chat-models";

export type ChatPageProps = { conversationId?: string };

export default function ChatPage({ conversationId }: ChatPageProps) {
  const profileId = useActiveProfileLive()?.id ?? null;
  const persistence = usePersistence();
  const providers = useAiProvidersLive();
  const bindings = useAiModelBindingsLive(profileId);
  const selectedId = useAiRuntimeStore((s) => s.selectedProviderId);
  const conversations = useChatConversationsLive(profileId);
  const nav = useChatConversationNav(conversations, conversationId);
  const messages = useChatMessagesLive(profileId, nav.activeId);
  const onModelChange = useChatModelSelection({
    profileId,
    activeId: nav.activeId,
    isDraft: nav.isDraft,
    providers: providers ?? [],
  });

  const fallback = resolveChatModels(
    providers ?? [],
    bindings ?? [],
    selectedId
  );
  const activeConv = conversations?.find((c) => c.id === nav.activeId);
  const model = resolveActiveChatModel(activeConv, providers ?? [], fallback);

  const { rename, remove } = useChatConversationActions({
    persistence,
    profileId,
    activeId: nav.activeId,
    startNew: nav.startNew,
  });

  return (
    <div className="space-y-4 p-4" data-testid="chat-page">
      <ChatHeader />
      {providers === undefined ? (
        <div className="flex items-center justify-center p-8 text-slate-400">
          Loading…
        </div>
      ) : providers.length === 0 ? (
        <CreateProvidersEmpty />
      ) : (
        <ChatWorkspace
          profileId={profileId}
          conversations={conversations ?? []}
          activeId={nav.activeId}
          messages={messages ?? []}
          providers={providers}
          provider={model.provider}
          modelId={model.modelId}
          generationProvider={fallback.generationProvider}
          generationModelId={fallback.generationModelId}
          onModelChange={onModelChange}
          onSelect={nav.select}
          onNew={nav.startNew}
          onRename={rename}
          onDelete={remove}
        />
      )}
    </div>
  );
}
