import type { KRDEvent } from "@kaiord/core";
import type {
  FitEvent,
  FitEventMessage,
  FitEventType,
} from "../schemas/fit-event";
import {
  FIT_EVENT_TO_KRD_TYPE,
  KRD_TYPE_TO_FIT_EVENT,
  KRD_TYPE_TO_FIT_EVENT_TYPE,
} from "./event-type-maps";

const mapEventTypeToKrd = (
  fitEvent: FitEvent,
  fitEventType: FitEventType
): KRDEvent["eventType"] => {
  if (fitEvent === "timer") {
    switch (fitEventType) {
      case "start":
        return "start";
      case "stop":
        return "stop";
      case "stopDisable":
      case "stopDisableAll":
        return "pause";
      default:
        return "timer";
    }
  }
  return FIT_EVENT_TO_KRD_TYPE[fitEvent] ?? "marker";
};

/** Maps FIT EVENT to KRD event. */
export const mapFitEventToKrd = (fit: FitEventMessage): KRDEvent => ({
  timestamp: new Date(fit.timestamp * 1000).toISOString(),
  eventType: mapEventTypeToKrd(fit.event, fit.eventType),
  eventGroup: fit.eventGroup,
  data: fit.data,
});

/** Maps KRD event to FIT EVENT. */
export const mapKrdEventToFit = (krd: KRDEvent): Partial<FitEventMessage> => ({
  timestamp: Math.floor(new Date(krd.timestamp).getTime() / 1000),
  event: KRD_TYPE_TO_FIT_EVENT[krd.eventType] ?? "userMarker",
  eventType: KRD_TYPE_TO_FIT_EVENT_TYPE[krd.eventType] ?? "marker",
  eventGroup: krd.eventGroup,
  data: krd.data,
});
