/**
 * The card's trace of a Garmin entry left on another day (design §3.11,
 * AC-19). The visible text is short; the accessible name is the sentence the
 * detail shows. A card that is itself a button cannot expose an inner name,
 * so it appends `useGarminDriftLabel` to its own.
 */
import type { Locale } from "@kaiord/i18n";
import { useTranslation } from "react-i18next";

import type { GarminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import {
  shortWeekdayName,
  weekdayDate,
} from "../../../utils/calendar-day-labels";
import { useGarminDriftOf } from "./garmin-drift-context";

const dayNumber = (date: string) => String(Number(date.slice(8)));

/** "Garmin still on Tue, Oct 6", or "may still be on" when unconfirmed. */
export const driftSentence = (
  t: (key: string, params: { date: string }) => string,
  locale: Locale,
  drift: GarminDateDrift
) => {
  const date = weekdayDate(drift.placedOn, locale);
  return drift.certainty === "placed"
    ? t("garminDrift.placed", { date })
    : t("garminDrift.unconfirmed", { date });
};

export const useGarminDriftSentence = (drift: GarminDateDrift | undefined) => {
  const { t } = useTranslation("calendar");
  const locale = useActiveLocale();
  return drift ? driftSentence(t, locale, drift) : undefined;
};

export const useGarminDriftLabel = (workoutId: string) =>
  useGarminDriftSentence(useGarminDriftOf(workoutId));

export function GarminDriftBadge({ workoutId }: { workoutId: string }) {
  const { t } = useTranslation("calendar");
  const locale = useActiveLocale();
  const drift = useGarminDriftOf(workoutId);
  const label = useGarminDriftSentence(drift);
  if (!drift || !label) return null;
  const day = `${shortWeekdayName(drift.placedOn, locale)} ${dayNumber(drift.placedOn)}`;
  return (
    <span
      role="img"
      data-testid="garmin-drift-badge"
      aria-label={label}
      className="shrink-0 rounded-full border border-edge-soft px-2 py-px text-[11px] font-medium text-ink-muted tabular-nums"
    >
      {drift.certainty === "placed"
        ? t("garminDrift.badge", { day })
        : t("garminDrift.badgeUnconfirmed", { day })}
    </span>
  );
}
