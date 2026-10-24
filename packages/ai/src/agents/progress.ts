/**
 * Progress a generate-mode run reports while it works. Every value is read
 * from the run itself — the attempt counter, the partial structured output —
 * never estimated from elapsed time, so a consumer can show it as fact.
 */
export type GenerateProgressPhase =
  /** The request is sent; the model has not produced output yet. */
  | "requesting"
  /**
   * The model is reasoning before it writes (a provider that streams
   * reasoning parts); no output exists yet, but the model is working.
   */
  | "reasoning"
  /** Output is arriving; `items` counts what the partial output holds. */
  | "generating"
  /** The output is complete and is being checked against the schema. */
  | "validating";

/**
 * Why the previous attempt failed, on every update of an attempt above 1:
 * `truncated` — the output hit the token limit before it was complete;
 * `invalid` — it was complete but failed validation; `provider` — the
 * provider failed with a transient error.
 */
export type GenerateRetryReason = "truncated" | "invalid" | "provider";

export type GenerateProgress = {
  phase: GenerateProgressPhase;
  /** 1-based; an attempt above 1 is a retry (see `retryReason`). */
  attempt: number;
  maxAttempts: number;
  retryReason?: GenerateRetryReason;
  /** Present only when the agent defines `countItems` and output streams. */
  items?: number;
  /**
   * The partial output as of this update, while `generating`. Updates follow
   * `items`, so each one carries the output at the moment an item began.
   */
  partial?: unknown;
};

export type OnGenerateProgress = (progress: GenerateProgress) => void;

type ProgressUpdate = Omit<GenerateProgress, "maxAttempts">;

const sameAs = (a: GenerateProgress | undefined, b: ProgressUpdate) =>
  a?.phase === b.phase && a.attempt === b.attempt && a.items === b.items;

/**
 * Phases only move forward within an attempt, and attempts only forward: a
 * reasoning part that arrives after output began (the two streams are read
 * concurrently), or a late update from a finished attempt, is dropped.
 */
const ORDER: Record<GenerateProgressPhase, number> = {
  requesting: 0,
  reasoning: 1,
  generating: 2,
  validating: 3,
};

const goesBack = (a: GenerateProgress | undefined, b: ProgressUpdate) =>
  a !== undefined &&
  (b.attempt < a.attempt ||
    (a.attempt === b.attempt && ORDER[b.phase] < ORDER[a.phase]));

/**
 * Forwards an update only when it differs from the last one, so a consumer
 * hears about phase and count changes rather than every streamed token.
 */
export const createProgressEmitter = (
  onProgress: OnGenerateProgress | undefined,
  maxAttempts: number
) => {
  let last: GenerateProgress | undefined;
  return (update: ProgressUpdate): void => {
    if (!onProgress || sameAs(last, update) || goesBack(last, update)) return;
    last = { ...update, maxAttempts };
    onProgress(last);
  };
};
