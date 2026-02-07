import type { KRDEvent } from "@kaiord/core";
import type { FitEvent, FitEventType } from "../schemas/fit-event";

export const FIT_EVENT_TO_KRD_TYPE: Record<FitEvent, KRDEvent["eventType"]> = {
  timer: "event_timer",
  workout: "event_start",
  workoutStep: "event_workout_step_change",
  powerDown: "event_stop",
  powerUp: "event_start",
  offCourse: "event_marker",
  session: "event_session_start",
  lap: "event_lap",
  coursePoint: "event_marker",
  battery: "event_marker",
  virtualPartnerPace: "event_marker",
  hrHighAlert: "event_marker",
  hrLowAlert: "event_marker",
  speedHighAlert: "event_marker",
  speedLowAlert: "event_marker",
  cadHighAlert: "event_marker",
  cadLowAlert: "event_marker",
  powerHighAlert: "event_marker",
  powerLowAlert: "event_marker",
  recoveryHr: "event_marker",
  batteryLow: "event_marker",
  timeDurationAlert: "event_marker",
  distanceDurationAlert: "event_marker",
  calorieDurationAlert: "event_marker",
  activity: "event_activity_start",
  fitnessEquipment: "event_marker",
  length: "event_lap",
  userMarker: "event_marker",
  sportPoint: "event_marker",
  calibration: "event_marker",
  frontGearChange: "event_marker",
  rearGearChange: "event_marker",
  riderPositionChange: "event_marker",
  elevHighAlert: "event_marker",
  elevLowAlert: "event_marker",
};

export const KRD_TYPE_TO_FIT_EVENT: Record<KRDEvent["eventType"], FitEvent> = {
  event_start: "timer",
  event_stop: "timer",
  event_pause: "timer",
  event_resume: "timer",
  event_lap: "lap",
  event_marker: "userMarker",
  event_timer: "timer",
  event_workout_step_change: "workoutStep",
  event_session_start: "session",
  event_activity_start: "activity",
};

export const KRD_TYPE_TO_FIT_EVENT_TYPE: Record<
  KRDEvent["eventType"],
  FitEventType
> = {
  event_start: "start",
  event_stop: "stop",
  event_pause: "stopDisable",
  event_resume: "start",
  event_lap: "marker",
  event_marker: "marker",
  event_timer: "start",
  event_workout_step_change: "marker",
  event_session_start: "start",
  event_activity_start: "start",
};
