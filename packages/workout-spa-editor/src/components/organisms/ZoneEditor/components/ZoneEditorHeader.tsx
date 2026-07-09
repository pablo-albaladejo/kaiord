/**
 * ZoneEditorHeader Component
 *
 * Header for zone editor.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import type { Profile } from "../../../../types/profile";

type ZoneEditorHeaderProps = {
  isPowerZones: boolean;
  zonesCount: number;
  profile: Profile;
};

export function ZoneEditorHeader({
  isPowerZones,
  zonesCount,
  profile,
}: ZoneEditorHeaderProps) {
  const t = useTranslate("zones");
  const cycling = profile.sportZones.cycling;
  const ftp = cycling?.thresholds.ftp;
  const lthr = cycling?.thresholds.lthr;

  const title = isPowerZones
    ? t("header.powerTitle")
    : t("header.heartRateTitle");
  const description = isPowerZones
    ? t("header.powerDescription", {
        count: zonesCount,
        suffix: ftp ? t("header.ftpSuffix", { ftp }) : "",
      })
    : t("header.heartRateDescription", {
        count: zonesCount,
        suffix: lthr ? t("header.lthrSuffix", { lthr }) : "",
      });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
