import type { Logger } from "@kaiord/core";
import type { AiTelemetryEvent, AiTelemetrySink } from "./telemetry-types";

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as { then?: unknown } | null | undefined)?.then === "function";

/**
 * A faulty logger must never change a run's or a turn's outcome, whether it
 * throws or returns a promise that rejects. Never awaited.
 */
export const warnBestEffort = (
  logger: Logger | undefined,
  message: string,
  context: Record<string, unknown>
): void => {
  try {
    const result: unknown = logger?.warn(message, context);
    if (isThenable(result)) result.then(undefined, () => undefined);
  } catch {
    // Best-effort: the warning is lost, the caller's outcome is kept.
  }
};

/**
 * Telemetry is best-effort: a faulty sink must never change a run's or a
 * turn's outcome, whether it throws or returns a promise that rejects. The
 * failure is not silent, though: it is reported once, as a warning, with the
 * event type and the sink's error. A returned promise is never awaited.
 */
export const emitBestEffort = (
  sink: AiTelemetrySink,
  event: AiTelemetryEvent,
  logger?: Logger
): void => {
  const report = (error: unknown): void =>
    warnBestEffort(logger, "Telemetry sink failed", {
      type: event.type,
      error,
    });
  try {
    const result: unknown = sink.emit(event);
    if (isThenable(result)) result.then(undefined, report);
  } catch (error) {
    report(error);
  }
};
