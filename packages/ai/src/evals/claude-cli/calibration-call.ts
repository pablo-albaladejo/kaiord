import type { LiveSession, StopState } from "./live-session";
import type { CliRun } from "./stream-messages";
import { totalInputTokens } from "./stream-messages";

/** Fixed and minimal, so its input tokens measure the CLI's own overhead. */
export const CALIBRATION_REQUEST = {
  system: "Reply with the single word ok.",
  prompt: "ok?",
} as const;

/** Observed ~670 hidden input tokens; above this something escaped isolation. */
export const MAX_HIDDEN_OVERHEAD_TOKENS = 1000;

export type Calibration =
  | { ok: true; run: CliRun; overheadTokens: number }
  | { ok: false; stop: StopState };

/**
 * The first call of every pass. It counts against the call budget, and a
 * context leak stops the pass before any case is measured.
 */
export const calibrate = async (
  session: LiveSession,
  modelId: string
): Promise<Calibration> => {
  let run: CliRun;
  try {
    run = await session.call({ modelId, ...CALIBRATION_REQUEST });
  } catch {
    return { ok: false, stop: session.stopped() ?? unknownStop };
  }
  const overheadTokens = totalInputTokens(run.result);
  if (overheadTokens > MAX_HIDDEN_OVERHEAD_TOKENS) {
    session.halt({
      kind: "context-leak",
      reason: `the calibration call reported ${overheadTokens} input tokens (limit ${MAX_HIDDEN_OVERHEAD_TOKENS}, observed ~670): probable context leak, such as a user CLAUDE.md or a setting that escaped isolation`,
    });
  }
  const stop = session.stopped();
  return stop ? { ok: false, stop } : { ok: true, run, overheadTokens };
};

const unknownStop: StopState = {
  kind: "harness-fault",
  reason: "the calibration call failed",
};
