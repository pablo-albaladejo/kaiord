import type { KRDLapTrigger } from "@kaiord/core";
import type { FitLapTrigger } from "../schemas/fit-lap-trigger";

/**
 * Maps FIT lap trigger to KRD lap trigger.
 * Position-based triggers are consolidated into "position".
 */
export const mapFitLapTriggerToKrd = (fit: FitLapTrigger): KRDLapTrigger => {
  switch (fit) {
    case "manual":
      return "manual";
    case "time":
      return "time";
    case "distance":
      return "distance";
    case "positionStart":
    case "positionLap":
    case "positionWaypoint":
    case "positionMarked":
      return "position";
    case "sessionEnd":
      return "session_end";
    case "fitnessEquipment":
      return "fitness_equipment";
  }
};

/**
 * Maps KRD lap trigger to FIT lap trigger.
 * Position defaults to positionLap.
 */
export const mapKrdLapTriggerToFit = (krd: KRDLapTrigger): FitLapTrigger => {
  switch (krd) {
    case "manual":
      return "manual";
    case "time":
      return "time";
    case "distance":
      return "distance";
    case "position":
      return "positionLap";
    case "session_end":
      return "sessionEnd";
    case "fitness_equipment":
      return "fitnessEquipment";
  }
};
