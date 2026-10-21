/**
 * Progress a generate-mode run reports while it works. Every value is read
 * from the run itself — the attempt counter, the partial structured output —
 * never estimated from elapsed time, so a consumer can show it as fact.
 */
export type GenerateProgressPhase =
  /** The request is sent; the model has not produced output yet. */
  | "requesting"
  /** Output is arriving; `items` counts what the partial output holds. */
  | "generating"
  /** The output is complete and is being checked against the schema. */
  | "validating";

export type GenerateProgress = {
  phase: GenerateProgressPhase;
  /** 1-based; an attempt above 1 is a schema-repair retry. */
  attempt: number;
  maxAttempts: number;
  /** Present only when the agent defines `countItems` and output streams. */
  items?: number;
};

export type OnGenerateProgress = (progress: GenerateProgress) => void;

type ProgressUpdate = Omit<GenerateProgress, "maxAttempts">;

const sameAs = (a: GenerateProgress | undefined, b: ProgressUpdate) =>
  a?.phase === b.phase && a.attempt === b.attempt && a.items === b.items;

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
    if (!onProgress || sameAs(last, update)) return;
    last = { ...update, maxAttempts };
    onProgress(last);
  };
};
