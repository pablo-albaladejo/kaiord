import { Sparkles } from "lucide-react";

import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import { AiWorkoutForm } from "./AiWorkoutForm";
import { AiWorkoutInputEmpty } from "./AiWorkoutInputEmpty";

type AiWorkoutInputProps = {
  onSettingsClick: () => void;
};

export const AiWorkoutInput: React.FC<AiWorkoutInputProps> = ({
  onSettingsClick,
}) => {
  const t = useTranslate("create-workout");
  const providers = useAiProvidersLive();

  // `undefined` is the loading phase. Render nothing so the gradient
  // panel does not flash an empty CTA before the user's persisted
  // providers resolve.
  if (providers === undefined) return null;

  return (
    <div className="rounded-lg border border-edge bg-surface-elevated p-6 shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-ink-muted" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("generator.title")}
        </h2>
      </div>
      <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
        {t("generator.subtitle")}
      </p>
      {providers.length === 0 ? (
        <AiWorkoutInputEmpty onSettingsClick={onSettingsClick} />
      ) : (
        <AiWorkoutForm />
      )}
    </div>
  );
};
