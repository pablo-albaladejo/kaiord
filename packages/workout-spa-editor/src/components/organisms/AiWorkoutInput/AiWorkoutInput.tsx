import { Sparkles } from "lucide-react";

import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { AiWorkoutForm } from "./AiWorkoutForm";
import { AiWorkoutInputEmpty } from "./AiWorkoutInputEmpty";

type AiWorkoutInputProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInput: React.FC<AiWorkoutInputProps> = ({
  onSettingsClick,
}) => {
  const providers = useAiProvidersLive();

  // `undefined` is the loading phase. Render nothing so the gradient
  // panel does not flash an empty CTA before the user's persisted
  // providers resolve.
  if (providers === undefined) return null;

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          AI Workout Generator
        </h2>
      </div>
      <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
        Describe your workout in natural language and let AI create it.
      </p>
      {providers.length === 0 ? (
        <AiWorkoutInputEmpty onSettingsClick={onSettingsClick} />
      ) : (
        <AiWorkoutForm />
      )}
    </div>
  );
};
