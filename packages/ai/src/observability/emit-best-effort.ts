import type { Logger } from "@kaiord/core";
import type { AiTelemetryEvent, AiTelemetrySink } from "./telemetry-types";

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
    logger?.warn("Telemetry sink failed", { type: event.type, error });
  }
};
