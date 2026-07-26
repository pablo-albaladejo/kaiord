import type { Logger } from "@kaiord/core";
import type { AiTelemetryEvent, AiTelemetrySink } from "./telemetry-types";

const summarize = (event: AiTelemetryEvent): string =>
  `[ai:${event.type}] ${event.agentId}@${event.agentVersion} ` +
  `${event.provider}/${event.modelId} purpose=${event.purpose} ` +
  `${event.latencyMs}ms`;

/**
 * Development sink: logs a single-line summary per run. Carries ids and
 * metrics only (never payloads), so it is safe to leave enabled. Falls back to
 * `console` when no `Logger` is injected.
 */
export const createConsoleTelemetrySink = (
  logger?: Logger
): AiTelemetrySink => ({
  emit: (event) => {
    const line = summarize(event);
    if (event.type === "run_failed") {
      const warn = logger?.warn ?? ((m: string) => console.warn(m));
      warn(line, { error: event.error });
      return;
    }
    const debug = logger?.debug ?? ((m: string) => console.debug(m));
    debug(line, { usage: event.usage });
  },
});
