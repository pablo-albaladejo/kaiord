import type { GarminSportType } from "../schemas/common";
import { SportTypeId } from "../schemas/common";

const GARMIN_TO_KRD_SPORT: Record<string, string> = {
  running: "running",
  cycling: "cycling",
  swimming: "swimming",
  hiking: "running",
  strength_training: "generic",
  cardio_training: "generic",
  multi_sport: "generic",
};

const KRD_TO_GARMIN_SPORT: Record<string, GarminSportType> = {
  running: {
    sportTypeId: SportTypeId.RUNNING,
    sportTypeKey: "running",
    displayOrder: 1,
  },
  cycling: {
    sportTypeId: SportTypeId.CYCLING,
    sportTypeKey: "cycling",
    displayOrder: 2,
  },
  swimming: {
    sportTypeId: SportTypeId.SWIMMING,
    sportTypeKey: "swimming",
    displayOrder: 3,
  },
  generic: {
    sportTypeId: SportTypeId.CARDIO_TRAINING,
    sportTypeKey: "cardio_training",
    displayOrder: 6,
  },
};

export const mapGarminSportToKrd = (sportTypeKey: string): string =>
  GARMIN_TO_KRD_SPORT[sportTypeKey] ?? "generic";

export const mapKrdSportToGarmin = (sport: string): GarminSportType =>
  KRD_TO_GARMIN_SPORT[sport] ?? KRD_TO_GARMIN_SPORT["generic"];
