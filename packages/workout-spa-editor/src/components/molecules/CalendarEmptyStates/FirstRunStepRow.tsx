import { useTranslate } from "../../../i18n/use-translate";
import type { FirstRunStep } from "./first-run-steps";
import { FirstRunStepCta } from "./FirstRunStepCta";

export type FirstRunStepRowProps = {
  step: FirstRunStep;
  ordinal: number;
  /** The first step still missing unblocks the rest, so it carries the ink. */
  primary: boolean;
  /** Already true for this profile: the row reads as settled, not as a task. */
  done: boolean;
};

const ROW = "flex flex-wrap items-center gap-3 rounded-xl border p-4";

export function FirstRunStepRow({
  step,
  ordinal,
  primary,
  done,
}: FirstRunStepRowProps) {
  const t = useTranslate("calendar");
  const base = `firstRun.steps.${step.key}`;

  return (
    <li
      data-testid={`first-run-step-${step.key}`}
      data-done={done}
      className={`${ROW} ${primary ? "border-edge bg-surface-elevated" : "border-edge-soft bg-surface-page"}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${
          primary
            ? "bg-accent text-surface"
            : "border border-edge text-ink-muted"
        }`}
      >
        {ordinal}
      </span>
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <span
          className={`text-[15px] font-medium ${primary ? "text-ink-strong" : "text-ink-body"}`}
        >
          {t(`${base}.title`)}
        </span>
        <span className="text-xs leading-relaxed text-ink-muted text-pretty">
          {t(`${base}.consequence`)}
        </span>
      </div>
      <FirstRunStepCta step={step} primary={primary} done={done} />
    </li>
  );
}
