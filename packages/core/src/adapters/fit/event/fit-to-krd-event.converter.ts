import type { KRDEvent } from "../../../domain/schemas/krd/event";
import {
  fitEventMessageSchema,
  type FitEventMessage,
} from "../schemas/fit-event";
import { mapFitEventToKrd } from "./event.mapper";

/**
 * Converts a FIT EVENT message to KRD event format.
 *
 * @param data - Raw FIT EVENT message data
 * @returns KRD event object
 * @throws Error if FIT data is invalid
 */
export const convertFitToKrdEvent = (
  data: Record<string, unknown>
): KRDEvent => {
  const fitEvent = fitEventMessageSchema.parse(data) as FitEventMessage;
  return mapFitEventToKrd(fitEvent);
};

/**
 * Batch converts FIT EVENT messages to KRD events.
 *
 * @param events - Array of raw FIT EVENT message data
 * @returns Array of KRD event objects
 */
export const convertFitToKrdEvents = (
  events: Record<string, unknown>[]
): KRDEvent[] => {
  return events.map(convertFitToKrdEvent);
};
