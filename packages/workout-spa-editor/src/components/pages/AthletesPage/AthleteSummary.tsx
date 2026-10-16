import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";

/** The cycling thresholds under the name, when there are any. */
export function AthleteSummary({ profile }: { profile: Profile }) {
  const t = useTranslate("athlete");
  const thresholds = profile.sportZones.cycling?.thresholds;
  const parts = [
    thresholds?.ftp && t("athletes.summaryFtp", { value: thresholds.ftp }),
    thresholds?.lthr && t("athletes.summaryLthr", { value: thresholds.lthr }),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="m-0 text-[13px] text-ink-muted tabular-nums">
      {parts.join(" · ")}
    </p>
  );
}
