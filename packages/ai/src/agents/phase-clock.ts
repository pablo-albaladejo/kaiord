import type { AiRunTimings } from "../observability/telemetry-types";
import type { GenerateProgress, OnGenerateProgress } from "./progress";

/**
 * Times a streamed run from its own progress updates: each update closes the
 * phase before it, so the summary is what the user actually waited through,
 * per phase and over every attempt. `now` is injected for tests.
 */
export const createPhaseClock = (
  onProgress: OnGenerateProgress,
  now: () => number = Date.now
) => {
  const timings: AiRunTimings = { attempts: 0, phaseMs: {}, retryReasons: [] };
  let open: { phase: GenerateProgress["phase"]; since: number } | undefined;

  const close = (at: number) => {
    if (!open) return;
    const spent = timings.phaseMs[open.phase] ?? 0;
    timings.phaseMs[open.phase] = spent + (at - open.since);
  };

  const observe: OnGenerateProgress = (progress) => {
    const at = now();
    close(at);
    open = { phase: progress.phase, since: at };
    if (progress.attempt > timings.attempts) {
      timings.attempts = progress.attempt;
      if (progress.retryReason) timings.retryReasons.push(progress.retryReason);
    }
    onProgress(progress);
  };

  const stop = (): AiRunTimings => {
    close(now());
    open = undefined;
    return timings;
  };

  return { observe, stop };
};
