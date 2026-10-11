import type { SaveManualHealthMetricInput } from "../../health/save-manual-health-metric.use-case";
import type { LogHealthMetricInput } from "./chat-tool-deps";

const SECONDS_PER_HOUR = 3600;

/** The chat tool's sleep `value` is hours slept, never a sleep score. */
export const toManualHealthInput = (
  input: LogHealthMetricInput
): SaveManualHealthMetricInput =>
  input.metric === "sleep"
    ? {
        metric: "sleep",
        day: input.day,
        sleep: { durationSeconds: input.value * SECONDS_PER_HOUR },
      }
    : { metric: input.metric, day: input.day, value: input.value };
