import type { Translate } from "../../../i18n/use-translate";
import type { AiRunProgress } from "./ai-run-progress";

const RETRY_KEY = {
  truncated: "aiProgress.retryingTruncated",
  invalid: "aiProgress.retrying",
  provider: "aiProgress.retryingProvider",
} as const;

/** Live-region copy: changes only when the phase or the attempt changes. */
export const aiPhaseLabel = (t: Translate, run: AiRunProgress): string => {
  const { update, modelName: model } = run;
  if (!update) return t("aiProgress.preparing");
  if (update.phase === "validating") return t("aiProgress.validating");
  if (update.phase === "generating")
    return t("aiProgress.generating", { model });
  if (update.phase === "reasoning") return t("aiProgress.reasoning", { model });
  if (update.attempt > 1)
    return t(RETRY_KEY[update.retryReason ?? "invalid"], {
      model,
      attempt: update.attempt,
      max: update.maxAttempts,
    });
  return t("aiProgress.requesting", { model });
};
