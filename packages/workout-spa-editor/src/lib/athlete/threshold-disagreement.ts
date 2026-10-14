import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import { snapshotThresholdsFor } from "./snapshot-thresholds";
import type { ActiveSport } from "./sports";
import type { ThresholdLabelKey } from "./threshold-candidate-builders";
import {
  type ThresholdCandidate,
  thresholdCandidates,
} from "./threshold-candidates";

export type ThresholdDisagreement = {
  field: ThresholdFieldKey;
  labelKey: ThresholdLabelKey;
  unit?: string;
  source: string;
  at: string;
  /** The source's number, formatted for display and raw for writing. */
  incoming: string;
  incomingRaw: number;
  current: string;
};

type Mismatch = {
  current: ThresholdCandidate;
  incoming: ThresholdCandidate;
};

const firstMismatch = (
  current: ThresholdCandidate[],
  incoming: ThresholdCandidate[]
): Mismatch | undefined => {
  for (const candidate of incoming) {
    const mine = current.find((c) => c.field === candidate.field);
    if (!mine?.value || candidate.raw === undefined || !candidate.value) {
      continue;
    }
    if (mine.raw !== candidate.raw) {
      return { current: mine, incoming: candidate };
    }
  }
  return undefined;
};

/**
 * The first threshold on which a linked account's last sync disagrees with
 * what the profile holds — the source recorded one number, Kaiord is deriving
 * zones from another, and nothing on the page says so.
 *
 * Only a genuine disagreement counts: a field the profile has never been given
 * is not a conflict, and is left to the ordinary empty state.
 */
export function deriveThresholdDisagreement(
  profile: Profile,
  sport: ActiveSport,
  units: Units = "metric",
  hrUnit?: string
): ThresholdDisagreement | null {
  const stored = profile.sportZones[sport]?.thresholds;
  const current = thresholdCandidates(
    sport,
    stored,
    profile.maxHeartRate,
    units,
    hrUnit
  );

  for (const account of profile.linkedAccounts) {
    const snapshot = account.lastSyncedZonesSnapshot;
    if (!snapshot) continue;
    const incoming = thresholdCandidates(
      sport,
      snapshotThresholdsFor(sport, snapshot),
      snapshot.maxHeartRate,
      units,
      hrUnit
    );
    const hit = firstMismatch(current, incoming);
    if (!hit) continue;
    return {
      field: hit.incoming.field,
      labelKey: hit.incoming.labelKey,
      unit: hit.incoming.unit,
      source: account.source,
      at: snapshot.syncedAt,
      incoming: hit.incoming.value!,
      incomingRaw: hit.incoming.raw!,
      current: hit.current.value!,
    };
  }
  return null;
}
