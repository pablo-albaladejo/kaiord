/**
 * Profile → Snapshot Mapper
 *
 * Pure derivation of a `ProfileSnapshot` (the cross-cutting protocol
 * contract from `@kaiord/core`) out of the SPA's domain `Profile` plus
 * the currently-active sport selection.
 *
 * The snapshot intentionally drops per-zone tables — bridges only need
 * the threshold numbers to render the popup athlete card, not the full
 * zone breakdown the editor uses.
 */

import type { ProfileSnapshot } from "@kaiord/core";

import type { Profile } from "../../types/profile";

export type ActiveSport = "cycling" | "running" | "swimming";

const SCHEMA_VERSION = 1 as const;

const buildCyclingThresholds = (
  profile: Profile
): { ftp?: number } | undefined => {
  const ftp = profile.sportZones.cycling?.thresholds.ftp;
  if (typeof ftp !== "number") return undefined;
  return { ftp };
};

const buildRunningThresholds = (
  profile: Profile
): { thresholdPaceSecPerKm?: number; lthr?: number } | undefined => {
  const running = profile.sportZones.running?.thresholds;
  if (!running) return undefined;
  const out: { thresholdPaceSecPerKm?: number; lthr?: number } = {};
  if (typeof running.lthr === "number") out.lthr = running.lthr;
  if (
    typeof running.thresholdPace === "number" &&
    running.paceUnit === "min_per_km"
  ) {
    out.thresholdPaceSecPerKm = Math.round(running.thresholdPace * 60);
  }
  return Object.keys(out).length > 0 ? out : undefined;
};

const buildSwimmingThresholds = (
  profile: Profile
): { cssPaceSecPer100m?: number } | undefined => {
  const swimming = profile.sportZones.swimming?.thresholds;
  if (!swimming) return undefined;
  if (
    typeof swimming.thresholdPace === "number" &&
    swimming.paceUnit === "min_per_100m"
  ) {
    return { cssPaceSecPer100m: Math.round(swimming.thresholdPace * 60) };
  }
  return undefined;
};

const buildHeartRate = (
  profile: Profile,
  activeSport: ActiveSport | undefined
): { max?: number; lthr?: number } => {
  const out: { max?: number; lthr?: number } = {};
  // Pick the lthr from the active sport's threshold if available; the
  // popup shows ONE LTHR figure so picking the active sport is the most
  // accurate choice.
  if (activeSport) {
    const sportLthr = profile.sportZones[activeSport]?.thresholds.lthr;
    if (typeof sportLthr === "number") out.lthr = sportLthr;
  }
  // `max` HR is not modeled in the domain Profile yet; leave undefined
  // until the SPA Profile schema gains a max-HR field. The protocol's
  // optional `heartRate.max` keeps backward compat.
  return out;
};

export const profileToSnapshot = (
  profile: Profile,
  activeSport: ActiveSport | undefined,
  now: Date = new Date()
): ProfileSnapshot => {
  const thresholds: ProfileSnapshot["thresholds"] = {};
  const cycling = buildCyclingThresholds(profile);
  const running = buildRunningThresholds(profile);
  const swimming = buildSwimmingThresholds(profile);
  if (cycling) thresholds.cycling = cycling;
  if (running) thresholds.running = running;
  if (swimming) thresholds.swimming = swimming;

  const snapshot: ProfileSnapshot = {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: profile.name,
      ...(typeof profile.bodyWeight === "number"
        ? { bodyWeight: profile.bodyWeight }
        : {}),
    },
    ...(activeSport ? { activeSport } : {}),
    thresholds,
    heartRate: buildHeartRate(profile, activeSport),
    generatedAt: now.toISOString(),
  };

  return snapshot;
};
