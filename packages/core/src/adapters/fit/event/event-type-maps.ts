import type { KRDEvent } from "../../../domain/schemas/krd/event";
import type { FitEvent, FitEventType } from "../schemas/fit-event";

export const FIT_EVENT_TO_KRD_TYPE: Record<FitEvent, KRDEvent["eventType"]> = {
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

export const KRD_TYPE_TO_FIT_EVENT: Record<KRDEvent["eventType"], FitEvent> = {
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

export const KRD_TYPE_TO_FIT_EVENT_TYPE: Record<
  KRDEvent["eventType"],
  FitEventType
> = {
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
