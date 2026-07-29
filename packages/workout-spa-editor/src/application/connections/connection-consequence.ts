/**
 * The consequence banner above the source cards: what broke, and what stopped
 * arriving because of it.
 *
 * Three claims the reference design makes are absent, because no state backs
 * them. There is no "stopped syncing 3 days ago" — no transition timestamp is
 * recorded anywhere, so the date comes from the persisted `lastSyncAt` and is
 * phrased as the last data received. There is no "fell back to Garmin" —
 * `union` is the default multi-source mode and has no winner, so no source
 * ever "took over". And there is no "its access token expired" — only
 * `trainingpeaks-bridge` reports `needsReauth` at all, and no bridge can tell
 * an expired credential from one that was never issued.
 */
import type { Translate } from "../../i18n/use-translate";
import { calendarDay } from "./calendar-day";
import type { ConnectionCoverage } from "./connection-coverage";
import type { ConnectionSource } from "./connection-source";
import { sourceNeedsAttention } from "./connection-source";

export type ConnectionConsequence = {
  readonly title: string;
  readonly detail: string;
};

/**
 * A cause is named only for a lone source. With several affected, one of them
 * being out of date does not make the others out of date, and the count is the
 * only claim that holds for all of them.
 */
const titleOf = (
  affected: readonly ConnectionSource[],
  t: Translate
): string => {
  const only = affected.length === 1 ? affected[0] : undefined;
  if (only === undefined) return t("banner.many", { count: affected.length });
  return only.outdated
    ? t("banner.oneOutdated", { name: only.name })
    : t("banner.one", { name: only.name });
};

const consequenceOf = (coverage: ConnectionCoverage, t: Translate): string => {
  if (coverage.paused.length > 0) {
    return t("banner.paused", {
      types: coverage.paused.map((type) => t(`dataTypes.${type}`)).join(", "),
    });
  }
  return coverage.broken.length > 0
    ? t("banner.covered")
    : t("banner.noRoutes");
};

/**
 * The date is attached only for a lone affected source, so one source's last
 * sync is never presented as a set's.
 */
const sinceOf = (
  affected: readonly ConnectionSource[],
  t: Translate
): string | undefined => {
  const day =
    affected.length === 1 ? calendarDay(affected[0]?.lastSyncAt) : undefined;
  return day === undefined ? undefined : t("banner.since", { date: day });
};

export const buildConnectionConsequence = (
  sources: readonly ConnectionSource[],
  coverage: ConnectionCoverage,
  t: Translate
): ConnectionConsequence | null => {
  const affected = sources.filter(sourceNeedsAttention);
  if (affected.length === 0) return null;
  const detail = [consequenceOf(coverage, t), sinceOf(affected, t)]
    .filter((line): line is string => line !== undefined)
    .join(" ");
  return { title: titleOf(affected, t), detail };
};
