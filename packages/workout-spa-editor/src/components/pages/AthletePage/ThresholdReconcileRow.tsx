import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import type { ThresholdDisagreement } from "../../../lib/athlete";
import { sourceDisplayName } from "../../../lib/athlete/source-name";

const BUTTON =
  "rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

type ThresholdReconcileRowProps = {
  disagreement: ThresholdDisagreement;
  onUse: () => void;
  onKeep: () => void;
};

/* A source recorded one number and Kaiord is deriving zones from another.
   Marked with neutral surface and border only — the palette has no "warning"
   hue, and this is not an error anyway. The primary action IS the fix, so it
   is labelled with the number it applies rather than a generic verb. */
export function ThresholdReconcileRow({
  disagreement,
  onUse,
  onKeep,
}: ThresholdReconcileRowProps) {
  const t = useTranslate("athlete");
  const locale = useActiveLocale();

  const withUnit = (value: string): string =>
    disagreement.unit ? `${value} ${disagreement.unit}` : value;
  const recordedOn = new Date(disagreement.at).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-surface-elevated px-3.5 py-3">
      <div className="flex min-w-0 flex-1 basis-[200px] flex-col gap-[3px]">
        <span className="text-[13px] font-medium text-ink-strong tabular-nums">
          {t("reconcile.title", {
            source: sourceDisplayName(disagreement.source),
            value: withUnit(disagreement.incoming),
            date: recordedOn,
          })}
        </span>
        <span className="text-xs leading-[1.55] text-ink-muted">
          {t("reconcile.body", { current: withUnit(disagreement.current) })}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onUse}
          className={`${BUTTON} bg-accent text-surface hover:bg-accent/90`}
        >
          {t("reconcile.use", { value: disagreement.incoming })}
        </button>
        <button
          type="button"
          onClick={onKeep}
          className={`${BUTTON} border border-edge bg-transparent text-ink-body hover:text-ink-strong`}
        >
          {t("reconcile.keep", { value: disagreement.current })}
        </button>
      </div>
    </div>
  );
}
