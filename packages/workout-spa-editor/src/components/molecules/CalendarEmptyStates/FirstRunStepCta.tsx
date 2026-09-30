import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { FirstRunStep } from "./first-run-steps";

export type FirstRunStepCtaProps = {
  step: FirstRunStep;
  primary: boolean;
  done: boolean;
};

const CTA = "shrink-0 rounded-lg px-3.5 py-2.5 text-[13px] font-medium";
const SECONDARY = `${CTA} border border-edge text-ink-body hover:border-edge-strong hover:text-ink-strong`;
const PRIMARY = `${CTA} bg-accent text-surface hover:opacity-90`;

export function FirstRunStepCta({ step, primary, done }: FirstRunStepCtaProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();
  const label = t(`firstRun.steps.${step.key}.cta`);
  const className = primary ? PRIMARY : SECONDARY;

  if (done) {
    return (
      <span
        data-testid={`first-run-step-${step.key}-done`}
        className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-ink-body"
      >
        <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
        {t("firstRun.done")}
      </span>
    );
  }
  if (step.external) {
    return (
      <a
        href={step.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => navigate(step.href)}
      className={className}
    >
      {label}
    </button>
  );
}
