import { subSportEnum, type SubSport } from "../../domain/schemas/sub-sport";
import { fitSubSportEnum, type FitSubSport } from "./schemas/fit-sub-sport";

const FIT_TO_KRD_SUB_SPORT_MAP: Record<FitSubSport, SubSport> = {
  generic: "generic",
  treadmill: "treadmill",
  street: "street",
  trail: "trail",
  track: "track",
  spin: "spin",
  indoorCycling: "indoor_cycling",
  road: "road",
  mountain: "mountain",
  downhill: "downhill",
  recumbent: "recumbent",
  cyclocross: "cyclocross",
  handCycling: "hand_cycling",
  trackCycling: "track_cycling",
  indoorRowing: "indoor_rowing",
  elliptical: "elliptical",
  stairClimbing: "stair_climbing",
  lapSwimming: "lap_swimming",
  openWater: "open_water",
  flexibilityTraining: "flexibility_training",
  strengthTraining: "strength_training",
  warmUp: "warm_up",
  match: "match",
  exercise: "exercise",
  challenge: "challenge",
  indoorSkiing: "indoor_skiing",
  cardioTraining: "cardio_training",
  indoorWalking: "indoor_walking",
  eBikeFitness: "e_bike_fitness",
  bmx: "bmx",
  casualWalking: "casual_walking",
  speedWalking: "speed_walking",
  bikeToRunTransition: "bike_to_run_transition",
  runToBikeTransition: "run_to_bike_transition",
  swimToBikeTransition: "swim_to_bike_transition",
  atv: "atv",
  motocross: "motocross",
  backcountry: "backcountry",
  resort: "resort",
  rcDrone: "rc_drone",
  wingsuit: "wingsuit",
  whitewater: "whitewater",
  skateSkiing: "skate_skiing",
  yoga: "yoga",
  pilates: "pilates",
  indoorRunning: "indoor_running",
  gravelCycling: "gravel_cycling",
  eBikeMountain: "e_bike_mountain",
  commuting: "commuting",
  mixedSurface: "mixed_surface",
  navigate: "navigate",
  trackMe: "track_me",
  map: "map",
  singleGasDiving: "single_gas_diving",
  multiGasDiving: "multi_gas_diving",
  gaugeDiving: "gauge_diving",
  apneaDiving: "apnea_diving",
  apneaHunting: "apnea_hunting",
  virtualActivity: "virtual_activity",
  obstacle: "obstacle",
  all: "all",
};

const KRD_TO_FIT_SUB_SPORT_MAP: Record<SubSport, FitSubSport> =
  Object.fromEntries(
    Object.entries(FIT_TO_KRD_SUB_SPORT_MAP).map(([fit, krd]) => [krd, fit])
  ) as Record<SubSport, FitSubSport>;

export const mapSubSportToKrd = (fitSubSport: unknown): SubSport => {
  const result = fitSubSportEnum.safeParse(fitSubSport);

  if (!result.success) {
    return subSportEnum.enum.generic;
  }

  return FIT_TO_KRD_SUB_SPORT_MAP[result.data] || subSportEnum.enum.generic;
};

export const mapSubSportToFit = (krdSubSport: unknown): FitSubSport => {
  const result = subSportEnum.safeParse(krdSubSport);

  if (!result.success) {
    return fitSubSportEnum.enum.generic;
  }

  return KRD_TO_FIT_SUB_SPORT_MAP[result.data] || fitSubSportEnum.enum.generic;
};
