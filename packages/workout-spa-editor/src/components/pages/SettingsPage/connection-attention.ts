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

/**
 * How many bridges answered. A page cannot enumerate installed extensions:
 * `discovered` means "announced itself and answered a ping this page-life",
 * which is why the copy says detected rather than installed.
 */
export const countDetected = (
  connections: readonly BridgeConnectionState[]
): number => connections.filter((entry) => entry.discovered).length;

/**
 * The user's calendar day, not `toISOString()`'s: a sync at 02:00Z happened
 * the previous evening in New York, and the sentence is about their day.
 * Nothing when the stored value does not parse as a date.
 */
const dayOf = (timestamp: string | undefined): string | undefined => {
  if (timestamp === undefined) return undefined;
  const at = new Date(timestamp);
  if (Number.isNaN(at.getTime())) return undefined;
  const month = String(at.getMonth() + 1).padStart(2, "0");
  return `${at.getFullYear()}-${month}-${String(at.getDate()).padStart(2, "0")}`;
};

/**
 * Ranked by what the reader can do about it: an instruction outranks a date.
 * A signed-out session and an out-of-date extension both name their own fix,
 * and both routinely coexist with a `lastSyncAt` — you only get a re-auth
 * demand for an account you were already syncing — so ranking the date first
 * would hide the only actionable line in the most ordinary case.
 *
 * `needsReauth` is only ever set by the TrainingPeaks probe; for WHOOP the SPA
 * cannot tell an expired token from never having signed in, so the copy says
 * signed out rather than expired. `outdated` means the extension answered with
 * an unsupported protocol version — the probe succeeded, so "the check failed"
 * would be untrue.
 *
 * The date comes from `lastSyncAt`, which is persisted. `lastCheckedAt` is
 * when the SPA last probed, so after a reload it reads as seconds ago however
 * long a source has been down, and "broken since" is unsayable.
 */
const detailOf = (
  affected: readonly BridgeConnectionState[],
  t: Translate
): string => {
  if (affected.some((entry) => entry.needsReauth))
    return t("attention.signedOut");
  if (affected.some((entry) => entry.outdated))
    return t("attention.extensionOutdated");
  const since =
    affected.length === 1 ? dayOf(affected[0]?.lastSyncAt) : undefined;
  if (since !== undefined)
    return t("attention.noNewDataSince", { date: since });
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
