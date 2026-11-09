import type { AiTelemetryEvent, AiTelemetrySink } from "./telemetry-types";

export type RingBufferTelemetrySink = AiTelemetrySink & {
  /** A snapshot copy of the currently buffered events, oldest first. */
  events: () => AiTelemetryEvent[];
  clear: () => void;
};

const DEFAULT_CAPACITY = 100;

/**
 * Bounded in-memory sink for asserting emitted telemetry in tests and
 * consumer code. Keeps at most `capacity` most-recent events.
 */
export const createRingBufferTelemetrySink = (
  capacity: number = DEFAULT_CAPACITY
): RingBufferTelemetrySink => {
  let buffer: AiTelemetryEvent[] = [];
  return {
    emit: (event) => {
      buffer.push(event);
      if (buffer.length > capacity) buffer = buffer.slice(-capacity);
    },
    events: () => [...buffer],
    clear: () => {
      buffer = [];
    },
  };
};
