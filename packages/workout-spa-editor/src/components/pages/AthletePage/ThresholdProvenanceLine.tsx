import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import type { ThresholdProvenance } from "../../../lib/athlete";
import { sourceDisplayName } from "../../../lib/athlete/source-name";
import { formatRelativeTime } from "../../../utils/format-relative-time";
import { Icon, STATUS_ICON } from "../../atoms/Icon";

type ThresholdProvenanceLineProps = {
  provenance: ThresholdProvenance;
};

/* Where the number came from, in two states and no more: dim when it is
   fresh, ink + a triangle when it is old enough to want looking at. There is
   no third "all good" marker — silence is what all-good looks like.

   A hand-typed value is only dated once `profile.updatedAt` proves it old:
   on a recently written profile that timestamp says nothing about THIS field,
   so the line states the origin and stops there. */
export function ThresholdProvenanceLine({
  provenance,
}: ThresholdProvenanceLineProps) {
  const t = useTranslate("athlete");
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();

  const when = (iso: string): string => {
    const relative = formatRelativeTime(new Date(iso), new Date(), locale);
    return tCommon(relative.key, relative.params);
  };

  const text = (): string => {
    if (provenance.kind === "synced") {
      return t("provenance.synced", {
        source: sourceDisplayName(provenance.source),
        when: when(provenance.at),
      });
    }
    return provenance.stale
      ? t("provenance.manualSince", { when: when(provenance.since) })
      : t("provenance.manual");
  };

  if (!provenance.stale) {
    return <div className="text-xs text-ink-muted">{text()}</div>;
  }

  return (
    <div className="flex items-center gap-[5px] text-xs font-medium text-ink-strong">
      <Icon
        icon={STATUS_ICON.alert}
        size="xs"
        color="inherit"
        strokeWidth={2.25}
      />
      <span>{text()}</span>
    </div>
  );
}
