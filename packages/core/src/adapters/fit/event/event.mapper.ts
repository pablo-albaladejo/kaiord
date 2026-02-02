import type { KRDEvent } from "../../../domain/schemas/krd/event";
import type {
  FitEvent,
  FitEventMessage,
  FitEventType,
} from "../schemas/fit-event";

const FIT_EVENT_TO_KRD_TYPE: Record<FitEvent, KRDEvent["eventType"]> = {
  timer: "timer",
  workout: "start",
  workoutStep: "workout_step",
  powerDown: "stop",
  powerUp: "start",
  offCourse: "marker",
  session: "session",
  lap: "lap",
  coursePoint: "marker",
  battery: "marker",
  virtualPartnerPace: "marker",
  hrHighAlert: "marker",
  hrLowAlert: "marker",
  speedHighAlert: "marker",
  speedLowAlert: "marker",
  cadHighAlert: "marker",
  cadLowAlert: "marker",
  powerHighAlert: "marker",
  powerLowAlert: "marker",
  recoveryHr: "marker",
  batteryLow: "marker",
  timeDurationAlert: "marker",
  distanceDurationAlert: "marker",
  calorieDurationAlert: "marker",
  activity: "activity",
  fitnessEquipment: "marker",
  length: "lap",
  userMarker: "marker",
  sportPoint: "marker",
  calibration: "marker",
  frontGearChange: "marker",
  rearGearChange: "marker",
  riderPositionChange: "marker",
  elevHighAlert: "marker",
  elevLowAlert: "marker",
};

const KRD_TYPE_TO_FIT_EVENT: Record<KRDEvent["eventType"], FitEvent> = {
  start: "timer",
  stop: "timer",
  pause: "timer",
  resume: "timer",
  lap: "lap",
  marker: "userMarker",
  timer: "timer",
  workout_step: "workoutStep",
  session: "session",
  activity: "activity",
};

const KRD_TYPE_TO_FIT_EVENT_TYPE: Record<KRDEvent["eventType"], FitEventType> =
  {
    start: "start",
    stop: "stop",
    pause: "stopDisable",
    resume: "start",
    lap: "marker",
    marker: "marker",
    timer: "start",
    workout_step: "marker",
    session: "start",
    activity: "start",
  };

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
