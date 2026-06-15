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
import { useAiModelBindingsLive } from "../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../hooks/use-ai-providers-live";
import { useChatMessagesLive } from "../../hooks/use-chat-messages-live";
import { useAiRuntimeStore } from "../../store/ai-runtime-store";
import { ModelSelector } from "../organisms/AiWorkoutInput/ModelSelector";
import { ChatConversation } from "../organisms/Chat/ChatConversation";
import { ChatHeader } from "../organisms/Chat/ChatHeader";
import { CreateProvidersEmpty } from "./CreateWorkout/CreateProvidersEmpty";
import { resolveChatModels } from "./resolve-chat-models";

export default function ChatPage() {
  const active = useActiveProfileLive();
  const providers = useAiProvidersLive();
  const selectedId = useAiRuntimeStore((s) => s.selectedProviderId);
  const profileId = active?.id ?? null;
  const bindings = useAiModelBindingsLive(profileId);
  const messages = useChatMessagesLive(profileId);
  const hasProviders = (providers?.length ?? 0) > 0;
  const models = resolveChatModels(providers ?? [], bindings ?? [], selectedId);

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
          <ChatConversation
            profileId={profileId}
            provider={models.provider}
            modelId={models.modelId}
            generationProvider={models.generationProvider}
            generationModelId={models.generationModelId}
            messages={messages ?? []}
          />
        </>
      )}
    </div>
  );
}
