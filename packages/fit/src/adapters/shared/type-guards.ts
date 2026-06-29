import type { Sport } from "@kaiord/core";

import { mapSportToKrd } from "../sport/sport.mapper";

/**
 * Maps FIT sport type (camelCase string) to KRD sport type (snake_case).
 * Empty/invalid input falls back to `generic`.
 */
export const mapSportType = (fitSport: string | undefined): Sport =>
  mapSportToKrd(fitSport);
