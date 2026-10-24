import { streamText } from "ai";
import {
  callSettings,
  toUsage,
  validateOutput,
  type CallModelArgs,
  type GenerateOutcome,
  type ReportPhase,
} from "./call-model";
import { throwIfTruncated, toOutputError } from "./output-errors";

type Streamed = ReturnType<typeof streamText>;

// Reasoning arrives as its own stream parts, before any output: without
// reading them a run that thinks for a minute looks stalled.
const watchReasoning = async (result: Streamed, report: ReportPhase) => {
  for await (const part of result.fullStream) {
    if (part.type === "reasoning-start" || part.type === "reasoning-delta") {
      report("reasoning");
    }
  }
};

const watchOutput = async <TOutput>(
  result: Streamed,
  args: CallModelArgs<TOutput>,
  report: ReportPhase
) => {
  for await (const partial of result.partialOutputStream) {
    report("generating", args.definition.countItems?.(partial), partial);
  }
};

/**
 * Streaming twin of `callModel`: same request, same validation, plus a phase
 * report per reasoning part and per partial output. A provider failure
 * arrives as a stream `error` part handed to `onError`, not a throw, and the
 * result promises then reject with a generic error that drops the
 * `statusCode`; the first stream error is captured and rethrown so retry
 * classification sees the real failure (the same seam as
 * `chat/run-turn.ts`). Capturing it also replaces the SDK's default
 * `onError`, which logs the request body.
 */
export const streamModel = async <TOutput>(
  args: CallModelArgs<TOutput>,
  feedback: string | undefined,
  report: ReportPhase
): Promise<GenerateOutcome<TOutput>> => {
  let streamError: unknown;
  const result = streamText({
    ...callSettings(args, feedback),
    onError: ({ error }) => {
      streamError ??= error;
    },
  });
  const settled = async () => {
    await Promise.all([
      watchReasoning(result, report),
      watchOutput(result, args, report),
    ]);
    const done = streamError === undefined && !args.signal?.aborted;
    if (done) throwIfTruncated(await result.finishReason);
    // A failed or aborted stream also ends the loops; it must not claim to
    // validate.
    if (done) report("validating");
    return Promise.all([result.output, result.usage]);
  };
  const [raw, usage] = await settled().catch((e: unknown) => {
    throw streamError ?? toOutputError(e);
  });
  if (streamError !== undefined) throw streamError;
  return {
    output: validateOutput(args.definition, raw),
    usage: toUsage(usage),
  };
};
