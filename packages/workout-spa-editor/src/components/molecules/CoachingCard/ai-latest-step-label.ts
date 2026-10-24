import { pluralKey } from "../../../i18n/plural-key";
import type { Translate } from "../../../i18n/use-translate";
import type { AiLatestStep } from "./ai-latest-step";

const SECONDS_PER_MINUTE = 60;

const durationOf = (t: Translate, step: AiLatestStep & { kind: "step" }) => {
  if (step.meters !== undefined)
    return t("aiProgress.meters", { meters: step.meters });
  const seconds = step.seconds ?? 0;
  if (seconds >= SECONDS_PER_MINUTE && seconds % SECONDS_PER_MINUTE === 0)
    return t("aiProgress.minutes", { minutes: seconds / SECONDS_PER_MINUTE });
  return t("aiProgress.seconds", { seconds });
};

// The domain intensities, labelled by the editor's own `intensity` map.
const INTENSITIES = new Set([
  "warmup",
  "active",
  "cooldown",
  "rest",
  "recovery",
  "interval",
  "other",
]);

/** "Last step: 3 min · Active", or "Last step: 4× block of 6 steps". */
export const aiLatestStepLabel = (
  t: Translate,
  tEditor: Translate,
  step: AiLatestStep
): string => {
  if (step.kind === "block")
    return t(pluralKey("aiProgress.latestBlock", step.steps), {
      repeat: step.repeatCount,
      count: step.steps,
    });
  const duration = durationOf(t, step);
  const known = step.intensity && INTENSITIES.has(step.intensity);
  const summary = known
    ? `${duration} · ${tEditor(`intensity.${step.intensity}`)}`
    : duration;
  return t("aiProgress.latestStep", { summary });
};
