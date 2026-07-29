/**
 * Derives the Settings attention model from the bridge connection model.
 *
 * "Needs attention" is `error || needsReauth`, NOT `discovered &&
 * !sessionActive`. `tanita-bridge` has no session prober — its only session
 * call downloads the whole export CSV — so its `sessionActive` stays false
 * for as long as it is installed, and a session-shaped rule would report a
 * healthy Tanita as broken forever.
 */
import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import type { Translate } from "../../../i18n/use-translate";
import type { SettingsAttentionModel } from "./SettingsAttention";

export const needsAttention = (connection: BridgeConnectionState): boolean =>
  connection.error !== null || connection.needsReauth;

export const countInstalled = (
  connections: readonly BridgeConnectionState[]
): number => connections.filter((entry) => entry.discovered).length;

/** `YYYY-MM-DD`, or nothing when the stored value does not parse as a date. */
const dayOf = (timestamp: string | undefined): string | undefined => {
  if (timestamp === undefined) return undefined;
  const at = new Date(timestamp);
  return Number.isNaN(at.getTime()) ? undefined : at.toISOString().slice(0, 10);
};

/**
 * Two facts back a consequence line: `lastSyncAt`, which survives a reload
 * and says when data last arrived, and `needsReauth`, which says the upstream
 * session must be signed in again. `lastCheckedAt` is not one of them — it
 * records when the SPA last probed, so after a reload it reads as seconds ago
 * however long a source has been down, and "broken since" is unsayable.
 *
 * `needsReauth` is only ever set by the TrainingPeaks probe; for WHOOP the SPA
 * cannot tell an expired token from never having signed in, so the copy says
 * signed out rather than expired.
 */
const detailOf = (
  affected: readonly BridgeConnectionState[],
  t: Translate
): string => {
  const since =
    affected.length === 1 ? dayOf(affected[0]?.lastSyncAt) : undefined;
  if (since !== undefined)
    return t("attention.noNewDataSince", { date: since });
  if (affected.some((entry) => entry.needsReauth))
    return t("attention.signedOut");
  return t("attention.lastCheckFailed");
};

export const buildAttention = (
  connections: readonly BridgeConnectionState[],
  t: Translate
): SettingsAttentionModel | null => {
  const affected = connections.filter(needsAttention);
  if (affected.length === 0) return null;
  return {
    title: t(
      affected.length === 1 ? "attention.title_one" : "attention.title_other",
      { count: affected.length }
    ),
    detail: detailOf(affected, t),
  };
};
