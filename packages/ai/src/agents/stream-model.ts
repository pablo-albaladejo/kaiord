import { streamText } from "ai";
import type { AiUsage } from "../observability/telemetry-types";
import { sdkErrorUsage, toUsage, withUsage } from "./attempt-usage";
import { cutUsage, requestChars, streamedChars } from "./cut-request";
import {
  callSettings,
  validateOutput,
  type CallModelArgs,
  type GenerateOutcome,
  type ReportPhase,
} from "./call-model";
import { throwIfTruncated, toOutputError } from "./output-errors";

type Streamed = ReturnType<typeof streamText>;

// Reasoning arrives as its own stream parts, before any output: without
// reading them a run that thinks for a minute looks stalled.
// Also counts the output streamed so far, for the estimate of a cut attempt.
const watchReasoning = async (
  result: Streamed,
  report: ReportPhase,
  received: { chars: number }
) => {
  for await (const part of result.fullStream) {
    received.chars += streamedChars(part);
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
  // The finished step's usage, captured synchronously: an attempt that fails
  // after it (truncated, invalid) was billed for it, and reading it here never
  // waits on a result promise a failed stream may leave unsettled.
  let billed: AiUsage | undefined;
  const settings = callSettings(args, feedback);
  const received = { chars: 0 };
  // Cut before the final chunk (a Stop, a dropped stream once output began):
  // billed but unreported, so estimated. An error before any output is an
  // answer the Provider does not bill, and stays unmeasured.
  const cut = () =>
    billed === undefined && (args.signal?.aborted || received.chars > 0)
      ? cutUsage(
          requestChars(settings.system, settings.messages),
          received.chars
        )
      : undefined;
  const result = streamText({
    ...settings,
    onStepEnd: (step) => {
      billed = toUsage(step.usage);
    },
    onError: ({ error }) => {
      streamError ??= error;
    },
  });
  const settled = async () => {
    await Promise.all([
      watchReasoning(result, report, received),
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
    const reported = billed ?? sdkErrorUsage(e);
    const estimate = reported ? undefined : cut();
    throw withUsage(
      streamError ?? toOutputError(e),
      reported ?? estimate,
      estimate !== undefined
    );
  });
  if (streamError !== undefined)
    throw withUsage(streamError, billed ?? cut(), billed === undefined);
  try {
    return {
      output: validateOutput(args.definition, raw),
      usage: toUsage(usage),
    };
  } catch (error) {
    throw withUsage(error, billed ?? toUsage(usage));
  }
};
