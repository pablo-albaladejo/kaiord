/**
 * The consequence banner above the source cards: what broke, and what stopped
 * arriving because of it.
 *
 * Four sentences this banner must never grow, because nothing can back them
 * (the Connection notice it borrows for a lone source states none of them):
 * a duration ("down for 3 days") — no transition timestamp exists, so the date
 * is `lastSyncAt` and says when data last arrived; a hand-off ("fell back to
 * Garmin") — `union` is the default and has no winner, so nothing takes over;
 * an expiry ("its token expired") — only `trainingpeaks-bridge` reports
 * `needsReauth`, and no bridge distinguishes an expired credential from one
 * that was never issued; and a sign-out ("Garmin is signed out") — the probes
 * fold provider outages into the same answer as a dead credential, and
 * garmin's reads outlive the browser session outright, so the title states the
 * failed read and leaves the cause to the card.
 */
import type { Locale } from "@kaiord/i18n";
import { connectionNotice } from "@kaiord/i18n/connection-notices";

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
 * A lone source's title is its own Connection notice, worded by the one
 * source every surface and extension popup reads. With several affected, one
 * of them being out of date does not make the others out of date, and the
 * count is the only claim that holds for all of them.
 */
const titleOf = (
  affected: readonly ConnectionSource[],
  t: Translate,
  locale: Locale
): string => {
  const only = affected.length === 1 ? affected[0] : undefined;
  const notice =
    only?.connection == null
      ? null
      : connectionNotice(only.connection, only.name, locale);
  return notice?.message ?? t("banner.many", { count: affected.length });
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
 * The date qualifies a loss, so it is attached ONLY to the paused sentence.
 * The other two branches state that nothing stopped arriving, and "no new data
 * since <date>" appended to them contradicts the sentence it is joined to —
 * which is reachable and ordinary: a signed-out source whose types another
 * source still covers has a last sync like any other.
 *
 * It is also attached only for a lone affected source, so one source's last
 * sync is never presented as a set's.
 */
const sinceOf = (
  affected: readonly ConnectionSource[],
  coverage: ConnectionCoverage,
  t: Translate
): string | undefined => {
  if (coverage.paused.length === 0) return undefined;
  const day =
    affected.length === 1 ? calendarDay(affected[0]?.lastSyncAt) : undefined;
  return day === undefined ? undefined : t("banner.since", { date: day });
};

export const buildConnectionConsequence = (
  sources: readonly ConnectionSource[],
  coverage: ConnectionCoverage,
  t: Translate,
  locale: Locale
): ConnectionConsequence | null => {
  const affected = sources.filter(sourceNeedsAttention);
  if (affected.length === 0) return null;
  const detail = [consequenceOf(coverage, t), sinceOf(affected, coverage, t)]
    .filter((line): line is string => line !== undefined)
    .join(" ");
  return { title: titleOf(affected, t, locale), detail };
};
