import type { KRDEvent } from "@kaiord/core";

import type {
  FitEvent,
  FitEventMessage,
  FitEventType,
} from "../schemas/fit-event";
import {
  fitTimestampToIso,
  isoToFitTimestampSeconds,
} from "../shared/fit-timestamp";
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
        return "event_start";
      case "stop":
        return "event_stop";
      case "stopDisable":
      case "stopDisableAll":
        return "event_pause";
      default:
        return "event_timer";
    }
  }
  return FIT_EVENT_TO_KRD_TYPE[fitEvent] ?? "event_marker";
};

/** Maps FIT EVENT to KRD event. */
export const mapFitEventToKrd = (fit: FitEventMessage): KRDEvent => ({
  timestamp: fitTimestampToIso(fit.timestamp),
  eventType: mapEventTypeToKrd(fit.event, fit.eventType),
  eventGroup: fit.eventGroup,
  data: fit.data,
});

/** Maps KRD event to FIT EVENT. */
export const mapKrdEventToFit = (krd: KRDEvent): Partial<FitEventMessage> => ({
  timestamp: isoToFitTimestampSeconds(krd.timestamp),
  event: KRD_TYPE_TO_FIT_EVENT[krd.eventType] ?? "userMarker",
  eventType: KRD_TYPE_TO_FIT_EVENT_TYPE[krd.eventType] ?? "marker",
  eventGroup: krd.eventGroup,
  data: krd.data,
});
