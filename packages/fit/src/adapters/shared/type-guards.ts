import type { Sport } from "@kaiord/core";

import { mapSportToKrd } from "../sport/sport.mapper";

/**
 * Default values for FIT file generation and mapping
 */
export const DEFAULT_MANUFACTURER = "development" as const;

/**
 * Maps FIT sport type (camelCase string) to KRD sport type (snake_case).
 * Empty/invalid input falls back to `generic`.
 */
export const mapSportType = (fitSport: string | undefined): Sport =>
  mapSportToKrd(fitSport);
