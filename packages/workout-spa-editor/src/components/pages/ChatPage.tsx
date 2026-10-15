/**
 * ChatPage — routed `/chat` and `/chat/:conversationId` destination.
 *
 * Renders the active profile's conversation list alongside the active
 * conversation's thread. The active conversation is resolved from the route
 * (deep link) or an in-memory draft; a draft persists on its first message.
 * Model resolution prefers the conversation's own override, falling back to
 * the athlete's chat resolution (the one the AI settings show). Without a profile, a provider, or a key for
 * the only provider, the page says which and links to the fix.
 */
import { useMemo } from "react";

import { usePersistence } from "../../contexts/persistence-context";
import type { ActiveProfile } from "../../hooks/use-active-profile-live";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import { useChatConversationActions } from "../../hooks/use-chat-conversation-actions";
import { useChatConversationNav } from "../../hooks/use-chat-conversation-nav";
import { useChatConversationsLive } from "../../hooks/use-chat-conversations-live";
import { useChatMessagesLive } from "../../hooks/use-chat-messages-live";
import { useChatSearchPanel } from "../../hooks/use-chat-search-panel";
import { ChatGateNotice } from "../organisms/Chat/ChatGateNotice";
import { ChatHeader } from "../organisms/Chat/ChatHeader";
import { ChatLoading } from "../organisms/Chat/ChatLoading";
import { ChatWorkspace } from "../organisms/Chat/ChatWorkspace";
import { resolveChatGate } from "./chat-gate";
import { CreateProvidersEmpty } from "./CreateWorkout/CreateProvidersEmpty";
import { useChatPageModel } from "./use-chat-page-model";

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
  const conversations = useChatConversationsLive(profileId);
  const nav = useChatConversationNav(conversations, conversationId);
  const messages = useChatMessagesLive(profileId, nav.activeId);
  const search = useChatSearchPanel(profileId, conversations ?? [], nav.select);
  const { fallback, model, modelPicker } = useChatPageModel({
    profileId,
    providers,
    conversations,
    nav,
  });

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
          modelPicker={modelPicker}
          search={search}
          onSelect={nav.select}
          onNew={nav.startNew}
          onRename={rename}
          onDelete={remove}
        />
      )}
    </div>
  );
}
