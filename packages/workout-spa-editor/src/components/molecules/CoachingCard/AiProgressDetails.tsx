import type { GenerateProgress } from "@kaiord/ai";

import { pluralKey } from "../../../i18n/plural-key";
import { type Translate, useTranslate } from "../../../i18n/use-translate";
import { latestFinishedStep } from "./ai-latest-step";
import { aiLatestStepLabel } from "./ai-latest-step-label";
import type { AiRunProgress } from "./ai-run-progress";
import { useElapsedSeconds } from "./use-elapsed-seconds";

const MUTED = "text-xs text-slate-500 dark:text-slate-400";
const MS_PER_SECOND = 1000;

const attemptLabel = (t: Translate, update: GenerateProgress) => {
  const params = { attempt: update.attempt, max: update.maxAttempts };
  if (!update.retryReason) return t("aiProgress.attempt", params);
  const reason = t(`aiProgress.retryReason.${update.retryReason}`);
  return t("aiProgress.attemptWithReason", { ...params, reason });
};

/**
 * What the run is doing beyond its phase: why a reasoning phase is quiet,
 * the last step the model finished, the step count, the attempt, and how
 * long the current phase and the whole run have taken.
 */
export function AiProgressDetails({ progress }: { progress: AiRunProgress }) {
  const t = useTranslate("coaching");
  const tEditor = useTranslate("editor");
  // One clock for both counters, so the phase can never read above the total.
  const total = useElapsedSeconds(progress.startedAt);
  const phaseOffset = Math.floor(
    (progress.phaseStartedAt - progress.startedAt) / MS_PER_SECOND
  );
  const phase = Math.max(0, total - phaseOffset);
  const update = progress.update;
  const items = update?.items;
  const latest = latestFinishedStep(update?.partial);
  return (
    <>
      {update?.phase === "reasoning" && (
        <p data-testid="coaching-dialog-ai-reasoning-hint" className={MUTED}>
          {t("aiProgress.reasoningHint")}
        </p>
      )}
      {update?.phase === "generating" && latest && (
        <p data-testid="coaching-dialog-ai-latest" className="text-sm">
          {aiLatestStepLabel(t, tEditor, latest)}
        </p>
      )}
      <p className={`flex flex-wrap justify-center gap-3 ${MUTED}`}>
        {items !== undefined && (
          <span data-testid="coaching-dialog-ai-steps">
            {t(pluralKey("aiProgress.steps", items), { count: items })}
          </span>
        )}
        {update && update.attempt > 1 && (
          <span data-testid="coaching-dialog-ai-attempt">
            {attemptLabel(t, update)}
          </span>
        )}
        <span data-testid="coaching-dialog-ai-elapsed" className="tabular-nums">
          {update
            ? t("aiProgress.elapsedSplit", { phase, total })
            : t("aiProgress.elapsed", { seconds: total })}
        </span>
      </p>
    </>
  );
}
