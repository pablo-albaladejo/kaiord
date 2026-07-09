import { useChatPrefill } from "../../../hooks/use-chat-prefill";
import type { UseChatSearchPanel } from "../../../hooks/use-chat-search-panel";
import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { ChatConversationRecord } from "../../../types/chat/chat-conversation-record";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { ChatConversation } from "./ChatConversation";
import { ChatModelPicker } from "./ChatModelPicker";
import { ConversationSidebar } from "./ConversationSidebar";

export type ChatWorkspaceProps = {
  profileId: string | null;
  conversations: ChatConversationRecord[];
  activeId: string | null;
  messages: ChatMessageRecord[];
  providers: LlmProviderConfig[];
  provider: LlmProviderConfig | null;
  modelId: string | null;
  generationProvider: LlmProviderConfig | null;
  generationModelId: string | null;
  search: UseChatSearchPanel;
  onModelChange: (providerId: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

/** Two-column chat surface: the conversation list and the active thread (or a
 * prompt to pick/start one when no thread is selected). */
export function ChatWorkspace(props: ChatWorkspaceProps) {
  const t = useTranslate("chat");
  const prefill = useChatPrefill();
  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <ConversationSidebar
        conversations={props.conversations}
        activeId={props.activeId}
        searchQuery={props.search.query}
        searchActive={props.search.active}
        searchResults={props.search.results}
        onSearchChange={props.search.setQuery}
        onResultSelect={props.search.onResultSelect}
        onSelect={props.onSelect}
        onNew={props.onNew}
        onRename={props.onRename}
        onDelete={props.onDelete}
      />
      <div className="flex flex-col gap-3">
        <ChatModelPicker
          providers={props.providers}
          value={props.provider?.id ?? null}
          onChange={props.onModelChange}
        />
        {props.activeId ? (
          <ChatConversation
            profileId={props.profileId}
            conversationId={props.activeId}
            provider={props.provider}
            modelId={props.modelId}
            generationProvider={props.generationProvider}
            generationModelId={props.generationModelId}
            messages={props.messages}
            focusMessageId={props.search.focusMessageId}
            composerInitialText={prefill}
          />
        ) : (
          <p className="p-4 text-sm text-slate-400">
            {t("workspace.selectOrStart")}
          </p>
        )}
      </div>
    </div>
  );
}
