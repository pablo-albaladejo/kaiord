/**
 * The four tiles' copy, as data. Kept out of the component so each number's
 * wording is asserted without rendering — and so the cold-load placeholder is
 * one branch instead of four.
 *
 * A `null` summary is the state before the connection store has completed a
 * pass: every bridge row reads undiscovered because nothing has been asked
 * yet, so every tile renders a placeholder rather than a zero.
 */
import type { Locale } from "@kaiord/i18n";

import type { ConnectionSummary } from "../../../application/connections/connection-summary";
import type { Translate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";

export type SummaryTile = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  /** Only the attention tile can ask for something, and only when it counts
      more than zero. Coverage says nothing by being high, so it is not
      marked — silence when all is well. */
  readonly marked?: boolean;
};

export type SummaryTileDeps = {
  readonly t: Translate;
  readonly tCommon: Translate;
  readonly locale: Locale;
};

const LABELS = ["detected", "covered", "attention", "lastSync"] as const;

const lastSyncValue = (
  summary: ConnectionSummary,
  deps: SummaryTileDeps
): string => {
  if (summary.lastSync === undefined) return deps.t("summary.lastSyncNever");
  const relative = formatRelativeTime(
    new Date(summary.lastSync.at),
    new Date(),
    deps.locale
  );
  return deps.tCommon(relative.key, relative.params);
};

export const summaryTiles = (
  summary: ConnectionSummary | null,
  deps: SummaryTileDeps
): readonly SummaryTile[] => {
  const { t } = deps;
  const label = (key: (typeof LABELS)[number]) => t(`summary.${key}`);
  if (summary === null) {
    return LABELS.map((key) => ({
      id: key,
      label: label(key),
      value: t("summary.pending"),
    }));
  }
  return [
    {
      id: "detected",
      label: label("detected"),
      value: String(summary.detected),
      note: t("summary.detectedNote", { total: summary.detectedTotal }),
    },
    {
      id: "covered",
      label: label("covered"),
      value: String(summary.covered),
      note: t("summary.coveredNote", { total: summary.coveredTotal }),
    },
    {
      id: "attention",
      label: label("attention"),
      value: String(summary.attention),
      note: t(
        summary.attention === 1
          ? "summary.attentionNote_one"
          : "summary.attentionNote_other"
      ),
      marked: summary.attention > 0,
    },
    {
      id: "lastSync",
      label: label("lastSync"),
      value: lastSyncValue(summary, deps),
      note: summary.lastSync?.sourceName,
    },
  ];
};
