/**
 * What a brand-new profile sees.
 *
 * `CalendarEmptyBanners` used to render nothing here: every one of its five
 * children was gated on data existing, so with an empty database the emptiest
 * possible state was the one that said least. This is the fix — the three
 * things that have to be true, in order, each naming what stays broken while
 * it is not, plus the path that needs none of them.
 */
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { withOrigin } from "../../../routing/with-origin";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { FIRST_RUN_STEPS } from "./first-run-steps";
import { FirstRunStepRow } from "./FirstRunStepRow";

export type FirstRunGuideProps = {
  /** The rendered week's id, carried on `?week=` so Back returns here. */
  weekId: string;
};

export function FirstRunGuide({ weekId }: FirstRunGuideProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();

  return (
    <section
      data-testid="first-run-guide"
      className="flex flex-col gap-5 rounded-2xl border border-edge-soft bg-surface p-6"
    >
      <div className="flex max-w-[64ch] flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-[-0.024em] text-ink-strong">
          {t("firstRun.heading")}
        </h2>
        <p className="text-[13px] leading-relaxed text-ink-body text-pretty">
          {t("firstRun.body")}
        </p>
      </div>
      <ol className="flex list-none flex-col gap-2.5 p-0">
        {FIRST_RUN_STEPS.map((step, index) => (
          <FirstRunStepRow
            key={step.key}
            step={step}
            ordinal={index + 1}
            primary={index === 0}
          />
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2.5 border-t border-edge-soft pt-4">
        <span className="min-w-0 flex-1 basis-48 text-xs leading-relaxed text-ink-muted text-pretty">
          {t("firstRun.manual")}
        </span>
        <button
          type="button"
          data-testid="first-run-add-workout"
          onClick={() =>
            navigate(withOrigin("/workout/new", "calendar", { week: weekId }))
          }
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge px-3.5 py-2 text-[13px] font-medium text-ink-body hover:border-edge-strong hover:text-ink-strong"
        >
          <Icon icon={ICON_MAP.plus} size="sm" color="inherit" />
          {t("firstRun.addWorkout")}
        </button>
      </div>
    </section>
  );
}
