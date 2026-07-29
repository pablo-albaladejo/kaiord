/**
 * Derives the Settings attention model from the Connections page's own card
 * list, so the banner counts exactly what the cards mark amber. A second
 * predicate over the raw bridge rows would drift: `bridgeSourceStatus` already
 * resolves the cases that make a naive rule wrong — a bridge with no prober
 * reads as installed rather than broken, an unlinked one as available, and one
 * whose first probe has not answered as checking rather than as failing.
 */
import { calendarDay } from "../../../application/connections/calendar-day";
import type { ConnectionSource } from "../../../application/connections/connection-source";
import { sourceNeedsAttention } from "../../../application/connections/connection-source";
import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import type { Translate } from "../../../i18n/use-translate";
import type { SettingsAttentionModel } from "./SettingsAttention";

/** Re-exported under this surface's own name; the derivation is shared. */
export const needsAttention = sourceNeedsAttention;

/**
 * How many bridges answered. A page cannot enumerate installed extensions:
 * `discovered` means the extension announced itself and its last probe
 * reached it, which is why the copy says detected rather than installed.
 */
export const countDetected = (
  connections: readonly BridgeConnectionState[]
): number => connections.filter((entry) => entry.discovered).length;

/**
 * Ranked by what the reader can do about it: an instruction outranks a date.
 * Both instructions routinely coexist with a `lastSyncAt` — you only get a
 * re-auth demand for an account you were already syncing — so ranking the
 * date first would hide the only actionable line in the ordinary case.
 *
 * The fallback is the signed-out line rather than a failed-check line: every
 * remaining case is a reachable extension without a usable session, which is
 * the same verdict the source card states, and `needsReauth` only differs in
 * which sign-in the user has to repeat.
 *
 * The date comes from `lastSyncAt`, which is persisted. `lastCheckedAt` is
 * when the SPA last probed, so after a reload it reads as seconds ago however
 * long a source has been down, and "broken since" is unsayable.
 */
const detailOf = (
  affected: readonly ConnectionSource[],
  t: Translate
): string => {
  if (affected.some((source) => source.needsReauth))
    return t("attention.signedOut");
  if (affected.some((source) => source.outdated))
    return t("attention.extensionOutdated");
  const since =
    affected.length === 1 ? calendarDay(affected[0]?.lastSyncAt) : undefined;
  if (since !== undefined)
    return t("attention.noNewDataSince", { date: since });
  return t("attention.signedOut");
};

export const buildAttention = (
  sources: readonly ConnectionSource[],
  t: Translate
): SettingsAttentionModel | null => {
  const affected = sources.filter(needsAttention);
  if (affected.length === 0) return null;
  return {
    title: t(
      affected.length === 1 ? "attention.title_one" : "attention.title_other",
      { count: affected.length }
    ),
    detail: detailOf(affected, t),
  };
};
