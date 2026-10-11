/**
 * What a brand-new profile sees.
 *
 * Manual use is the main path, not a footnote: the guide leads with the three
 * starts that work in this browser alone — write a session, import a file,
 * log wellness — and lists the integrations below as optional, each naming
 * what it adds rather than what stays broken without it.
 */
import { useTranslate } from "../../../i18n/use-translate";
import { FIRST_RUN_STEPS, type FirstRunProgress } from "./first-run-steps";
import { FirstRunManualStarts } from "./FirstRunManualStarts";
import { FirstRunStepRow } from "./FirstRunStepRow";

export type FirstRunGuideProps = {
  /** The rendered week's id, carried on `?week=` so Back returns here. */
  weekId: string;
  /** Integrations already set up; a done one shows a check instead of its CTA. */
  done?: FirstRunProgress;
  /** Opens the wellness entry dialog for today. */
  onLogWellness?: () => void;
};

export function FirstRunGuide({
  weekId,
  done = {},
  onLogWellness,
}: FirstRunGuideProps) {
  const t = useTranslate("calendar");

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
      <FirstRunManualStarts weekId={weekId} onLogWellness={onLogWellness} />
      <div className="flex flex-col gap-2.5 border-t border-edge-soft pt-4">
        <div className="flex max-w-[64ch] flex-col gap-1">
          <h3 className="m-0 text-[13px] font-semibold text-ink-strong">
            {t("firstRun.optionalHeading")}
          </h3>
          <p className="m-0 text-xs leading-relaxed text-ink-muted text-pretty">
            {t("firstRun.optionalBody")}
          </p>
        </div>
        <ol className="flex list-none flex-col gap-2.5 p-0">
          {FIRST_RUN_STEPS.map((step, index) => (
            <FirstRunStepRow
              key={step.key}
              step={step}
              ordinal={index + 1}
              primary={false}
              done={done[step.key] === true}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
