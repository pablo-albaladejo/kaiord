import { krdEventSchema, type KRDEvent } from "@kaiord/core";
import type { FitEventMessage } from "../schemas/fit-event";
import { mapKrdEventToFit } from "./event.mapper";

/**
 * Converts a KRD event to FIT EVENT message format.
 *
 * @param data - KRD event object
 * @returns Partial FIT EVENT message data
 * @throws Error if KRD data is invalid
 */
export const convertKrdToFitEvent = (
  data: Record<string, unknown>
): Partial<FitEventMessage> => {
  const krdEvent = krdEventSchema.parse(data) as KRDEvent;
  return mapKrdEventToFit(krdEvent);
};

/**
 * Batch converts KRD events to FIT EVENT messages.
 *
 * @param events - Array of KRD event objects
 * @returns Array of partial FIT EVENT message data
 */
export const convertKrdToFitEvents = (
  events: Record<string, unknown>[]
): Partial<FitEventMessage>[] => {
  return events.map(convertKrdToFitEvent);
};
