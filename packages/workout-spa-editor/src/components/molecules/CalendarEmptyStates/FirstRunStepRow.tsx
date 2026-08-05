import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { FirstRunStep } from "./first-run-steps";

export type FirstRunStepRowProps = {
  step: FirstRunStep;
  ordinal: number;
  /** The first step is the one that unblocks the rest, so it carries the ink. */
  primary: boolean;
};

const ROW = "flex flex-wrap items-center gap-3 rounded-xl border p-4";
const CTA = "shrink-0 rounded-lg px-3.5 py-2.5 text-[13px] font-medium";

export function FirstRunStepRow({
  step,
  ordinal,
  primary,
}: FirstRunStepRowProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();
  const base = `firstRun.steps.${step.key}`;

  return (
    <li
      data-testid={`first-run-step-${step.key}`}
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
      {step.external ? (
        <a
          href={step.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CTA} border border-edge text-ink-body hover:border-edge-strong hover:text-ink-strong`}
        >
          {t(`${base}.cta`)}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => navigate(step.href)}
          className={
            primary
              ? `${CTA} bg-accent text-surface hover:opacity-90`
              : `${CTA} border border-edge text-ink-body hover:border-edge-strong hover:text-ink-strong`
          }
        >
          {t(`${base}.cta`)}
        </button>
      )}
    </li>
  );
}
