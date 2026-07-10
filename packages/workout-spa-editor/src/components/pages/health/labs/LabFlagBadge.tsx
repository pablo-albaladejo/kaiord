/**
 * LabFlagBadge — colour-coded out-of-range flag (F3.3), shared by the
 * per-parameter list and the report review.
 */
import type { LabFlag } from "@kaiord/core";

import { useTranslate } from "../../../../i18n/use-translate";
import { LAB_FLAG_STYLES } from "./lab-flag-display";

export const LabFlagBadge = ({ flag }: { flag: LabFlag }) => {
  const t = useTranslate("labs-ui");
  const { className } = LAB_FLAG_STYLES[flag];
  return (
    <span
      data-testid="lab-flag-badge"
      data-flag={flag}
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${className}`}
    >
      {t(`flag.${flag}`)}
    </span>
  );
};
