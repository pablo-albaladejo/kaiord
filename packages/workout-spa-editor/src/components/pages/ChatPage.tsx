/**
 * ChatPage — routed `/chat` destination (spa-ai-chat).
 *
 * Read side: renders the active profile's persisted transcript via one
 * `useChatMessagesLive` query, with the model selector reused from the AI
 * generation flow. When no AI provider is configured, the no-provider empty
 * state links to settings. The message composer and turn orchestration land
 * in a follow-up; this surface is the navigable, transcript-rendering shell.
 */
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import { useChatMessagesLive } from "../../hooks/use-chat-messages-live";
import { ModelSelector } from "../organisms/AiWorkoutInput/ModelSelector";
import { ChatHeader } from "../organisms/Chat/ChatHeader";
import { ChatMessageList } from "../organisms/Chat/ChatMessageList";
import { CreateProvidersEmpty } from "./CreateWorkout/CreateProvidersEmpty";

export default function ChatPage() {
  const active = useActiveProfileLive();
  const providers = useAiProvidersLive();
  const profileId = active?.id ?? null;
  const messages = useChatMessagesLive(profileId);
  const hasProviders = (providers?.length ?? 0) > 0;

  return (
    <div className="space-y-4 p-4" data-testid="chat-page">
      <ChatHeader />
      {providers === undefined ? (
        <div className="flex items-center justify-center p-8 text-slate-400">
          Loading…
        </div>
      ) : !hasProviders ? (
        <CreateProvidersEmpty />
      ) : (
        <>
          <ModelSelector />
          <ChatMessageList messages={messages ?? []} />
        </>
      )}
    </div>
  );
}
