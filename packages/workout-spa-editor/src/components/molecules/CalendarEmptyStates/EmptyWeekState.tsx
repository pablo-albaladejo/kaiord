/**
 * This week is empty, but the athlete's history is not.
 *
 * The old copy said "No workouts this week", which the seven empty day cells
 * already said. This one states the fact the cells cannot: when the last
 * session actually was, and the two readings of a gap — between blocks, or a
 * coach who has not published.
 */

import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { BannerButton } from "./banner-buttons";
import { ConsequenceBanner } from "./ConsequenceBanner";

export type EmptyWeekStateProps = {
  /** The rendered week's id, carried on `?week=` so Back returns here. */
  weekId: string;
  /** Formatted date of the latest session anywhere, when there is one. */
  latestDate?: string;
  onGoToLatest?: () => void;
};

export function EmptyWeekState({
  weekId,
  latestDate,
  onGoToLatest,
}: EmptyWeekStateProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();

  return (
    <ConsequenceBanner
      testId="empty-week-state"
      marked={false}
      headline={
        latestDate
          ? t("emptyWeek.headlineWithDate", { date: latestDate })
          : t("emptyWeek.headline")
      }
      consequence={t("emptyWeek.consequence")}
      actions={
        <>
          {onGoToLatest && latestDate && (
            <BannerButton primary onClick={onGoToLatest}>
              {t("emptyWeek.goToLatest", { date: latestDate })}
            </BannerButton>
          )}
          <BannerButton
            onClick={() =>
              navigate(withOrigin("/workout/new", "calendar", { week: weekId }))
            }
          >
            {t("emptyWeek.addWorkout")}
          </BannerButton>
        </>
      }
    />
  );
}
