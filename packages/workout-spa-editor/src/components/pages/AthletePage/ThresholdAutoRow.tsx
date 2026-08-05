import { useZonesAutoImport } from "../../../hooks/athlete/use-zones-auto-import";
import { useTranslate } from "../../../i18n/use-translate";
import { logger } from "../../../utils/logger";
import { Toggle } from "../../atoms/Toggle";

type ThresholdAutoRowProps = {
  profileId: string;
};

/* The switch that used to be `useState(true)` with no writer, bound to the
   policy that actually decides whether a source may overwrite these numbers.
   With no such policy there is no mechanism to govern, so nothing renders —
   a control over nothing is worse than no control. */
export function ThresholdAutoRow({ profileId }: ThresholdAutoRowProps) {
  const t = useTranslate("athlete");
  const { available, enabled, setEnabled } = useZonesAutoImport(profileId);

  if (!available) return null;

  const handleChange = (next: boolean) => {
    void setEnabled(next).catch((error: unknown) => {
      logger.warn("Failed to persist zones auto-import mode", { error });
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge-soft pt-3.5">
      <div className="flex min-w-0 flex-1 basis-[220px] flex-col gap-[3px]">
        <span className="text-[13px] font-medium text-ink-strong">
          {t("autoImport.title")}
        </span>
        <span className="text-xs leading-[1.55] text-ink-muted">
          {t("autoImport.hint")}
        </span>
      </div>
      <Toggle
        checked={enabled}
        onCheckedChange={handleChange}
        aria-label={t("autoImport.title")}
      />
    </div>
  );
}
