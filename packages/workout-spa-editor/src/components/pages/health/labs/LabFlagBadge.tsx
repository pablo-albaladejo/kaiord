/**
 * LabFlagBadge — the out-of-range flag (F3.3), shared by the per-parameter
 * list and the report review. Out of range is said with a glyph and the word;
 * in range is muted text with no glyph and no fill.
 */
import type { LabFlag } from "@kaiord/core";

import { useTranslate } from "../../../../i18n/use-translate";
import { ALERT_ICON, Icon } from "../../../atoms/Icon";
import { LAB_FLAG_STYLES } from "./lab-flag-display";

export const LabFlagBadge = ({ flag }: { flag: LabFlag }) => {
  const t = useTranslate("labs-ui");
  const { className, showsGlyph } = LAB_FLAG_STYLES[flag];
  return (
    <span
      data-testid="lab-flag-badge"
      data-flag={flag}
      className={`inline-flex items-center gap-1 whitespace-nowrap py-0.5 text-xs ${className}`}
    >
      {showsGlyph && (
        <Icon icon={ALERT_ICON} size="xs" color="inherit" strokeWidth={2} />
      )}
      {t(`flag.${flag}`)}
    </span>
  );
};
