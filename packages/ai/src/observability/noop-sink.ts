import type { AiTelemetrySink } from "./telemetry-types";

/**
 * Shared default sink for runtimes configured without telemetry. Emitting is a
 * no-op, so callers never branch on the presence of a sink.
 */
export const createNoopTelemetrySink = (): AiTelemetrySink => ({
  emit: () => {},
});
