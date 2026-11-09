import type { Logger } from "@kaiord/core";
import type { AiTelemetryEvent, AiTelemetrySink } from "./telemetry-types";

/** A faulty logger must never change a run's or a turn's outcome. */
export const warnBestEffort = (
  logger: Logger | undefined,
  message: string,
  context: Record<string, unknown>
): void => {
  try {
    logger?.warn(message, context);
  } catch {
    // Best-effort: the warning is lost, the caller's outcome is kept.
  }
};

/**
 * Telemetry is best-effort: a faulty sink must never change a run's or a
 * turn's outcome. The failure is not silent, though: it is reported once, as
 * a warning, with the event type and the sink's error.
 */
export const emitBestEffort = (
  sink: AiTelemetrySink,
  event: AiTelemetryEvent,
  logger?: Logger
): void => {
  try {
    sink.emit(event);
  } catch (error) {
    warnBestEffort(logger, "Telemetry sink failed", {
      type: event.type,
      error,
    });
  }
};
