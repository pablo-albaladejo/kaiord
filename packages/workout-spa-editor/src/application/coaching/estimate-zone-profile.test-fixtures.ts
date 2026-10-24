import type { EstimatedSegment, EstimatedZone } from "./estimate-zone-profile";

export const Z1: EstimatedZone = 1;
export const Z2: EstimatedZone = 2;
export const Z3: EstimatedZone = 3;
export const Z4: EstimatedZone = 4;
export const Z5: EstimatedZone = 5;

export const SEC_30 = 30;
export const MIN_1 = 60;
export const MIN_1_30 = 90;
export const MIN_2 = 120;
export const MIN_2_30 = 150;
export const MIN_3 = 180;
export const MIN_3_30 = 210;
export const MIN_4 = 240;
export const MIN_5 = 300;
export const MIN_7 = 420;
export const MIN_10 = 600;
export const MIN_12 = 720;
export const MIN_13 = 780;
export const MIN_15 = 900;
export const MIN_20 = 1200;
export const MIN_25 = 1500;
export const MIN_30 = 1800;
export const MIN_35 = 2100;
export const MIN_40 = 2400;
export const MIN_42 = 2520;
export const MIN_45 = 2700;
export const MIN_51 = 3060;
export const HOUR_1 = 3600;
export const MIN_61 = 3660;
export const MIN_66 = 3960;
export const MIN_69 = 4140;
export const HOUR_1_30 = 5400;
export const HOUR_2 = 7200;
export const HOUR_3 = 10800;
export const HOUR_6 = 21600;

export const TWO_TIMES = 2;
export const THREE_TIMES = 3;
export const FOUR_TIMES = 4;
export const FIVE_TIMES = 5;
export const SIX_TIMES = 6;
export const EIGHT_TIMES = 8;
export const TEN_TIMES = 10;

export const seg = (
  zone: EstimatedZone | null,
  seconds: number
): EstimatedSegment => ({ zone, seconds });

export const reps = (
  count: number,
  ...segments: Array<EstimatedSegment>
): Array<EstimatedSegment> =>
  Array.from({ length: count }, () => segments).flat();

export const total = (segments: Array<EstimatedSegment>): number =>
  segments.reduce((sum, segment) => sum + segment.seconds, 0);
