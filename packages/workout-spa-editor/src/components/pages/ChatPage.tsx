/**
 * ChatPage — routed `/chat` and `/chat/:conversationId` destination.
 *
 * Renders the active profile's conversation list alongside the active
 * conversation's thread. The active conversation is resolved from the route
 * (deep link) or an in-memory draft; a draft persists on its first message.
 * Model resolution prefers the conversation's own override, falling back to
 * the page-level chat resolution. Without a profile, a provider, or a key for
 * the only provider, the page says which and links to the fix.
 */
import { useMemo } from "react";

import { usePersistence } from "../../contexts/persistence-context";
import type { ActiveProfile } from "../../hooks/use-active-profile-live";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import { useChatConversationActions } from "../../hooks/use-chat-conversation-actions";
import { useChatConversationNav } from "../../hooks/use-chat-conversation-nav";
import { useChatConversationsLive } from "../../hooks/use-chat-conversations-live";
import { useChatMessagesLive } from "../../hooks/use-chat-messages-live";
import { useChatModelSelection } from "../../hooks/use-chat-model-selection";
import { useChatSearchPanel } from "../../hooks/use-chat-search-panel";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import { ChatGateNotice } from "../organisms/Chat/ChatGateNotice";
import { ChatHeader } from "../organisms/Chat/ChatHeader";
import { ChatLoading } from "../organisms/Chat/ChatLoading";
import { ChatWorkspace } from "../organisms/Chat/ChatWorkspace";
import { resolveChatGate } from "./chat-gate";
import { CreateProvidersEmpty } from "./CreateWorkout/CreateProvidersEmpty";
import { resolveActiveChatModel } from "./resolve-active-chat-model";
import { resolveChatModels } from "./resolve-chat-models";

export type ChatPageProps = { conversationId?: string };

function useChatGate(active: ActiveProfile | undefined) {
  const providers = useAiProvidersLive({ includeKeyless: true });
  return useMemo(() => resolveChatGate(active, providers), [active, providers]);
}

export default function ChatPage({ conversationId }: ChatPageProps) {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const persistence = usePersistence();
  const gate = useChatGate(active);
  const providers = gate.kind === "ready" ? gate.providers : [];
  const bindings = useAiModelBindingsLive(profileId);
  const selectedId = useAiRuntimeStore((s) => s.selectedProviderId);
  const conversations = useChatConversationsLive(profileId);
  const nav = useChatConversationNav(conversations, conversationId);
  const messages = useChatMessagesLive(profileId, nav.activeId);
  const search = useChatSearchPanel(profileId, conversations ?? [], nav.select);
  const onModelChange = useChatModelSelection({
    profileId,
    activeId: nav.activeId,
    isDraft: nav.isDraft,
    providers,
  });

  const fallback = resolveChatModels(providers, bindings ?? [], selectedId);
  const activeConv = conversations?.find((c) => c.id === nav.activeId);
  const model = resolveActiveChatModel(activeConv, providers, fallback);

  const { rename, remove } = useChatConversationActions({
    persistence,
    profileId,
    activeId: nav.activeId,
    startNew: nav.startNew,
  });

  return (
    <div className="space-y-4 p-4" data-testid="chat-page">
      <ChatHeader />
      {gate.kind === "loading" && <ChatLoading />}
      {gate.kind === "noProvider" && <CreateProvidersEmpty />}
      {(gate.kind === "noProfile" || gate.kind === "missingKey") && (
        <ChatGateNotice {...gate} />
      )}
      {gate.kind === "ready" && (
        <ChatWorkspace
          profileId={profileId}
          conversations={conversations ?? []}
          activeId={nav.activeId}
          messages={messages ?? []}
          providers={providers}
          provider={model.provider}
          modelId={model.modelId}
          requestedModelId={model.requestedModelId}
          generationProvider={fallback.generationProvider}
          generationModelId={fallback.generationModelId}
          search={search}
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
