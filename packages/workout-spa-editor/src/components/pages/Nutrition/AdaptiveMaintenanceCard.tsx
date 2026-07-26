import type { AdaptiveTdeeResult } from "@kaiord/core";

import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type AdaptiveMaintenanceCardProps = {
  adaptive: AdaptiveTdeeResult | null | undefined;
};

/**
 * Shows the adaptive maintenance value (back-calculated from logged intake vs
 * the weight trend) with a static estimate explanation. Renders only once the
 * estimate has sufficient paired history; otherwise the modeled maintenance
 * remains in use and this card is hidden.
 */
export function AdaptiveMaintenanceCard({
  adaptive,
}: AdaptiveMaintenanceCardProps) {
  const t = useTranslate("nutrition");
  if (!adaptive || !adaptive.sufficientData) return null;
  return (
    <Card
      className="border-edge bg-surface p-4"
      data-testid="adaptive-maintenance"
    >
      <div className="flex items-center gap-3">
        <Icon icon={ICON_MAP.flame} size="md" color="inherit" />
        <p className="m-0 text-[15px] font-semibold text-ink-strong">
          {t("adaptive.title")}
        </p>
        <span
          className="ml-auto text-[13px] font-semibold text-ink-strong"
          data-testid="adaptive-maintenance-value"
        >
          {Math.round(adaptive.maintenanceKcal)} kcal
        </span>
      </div>
      <p className="m-0 mt-3 text-[13px] text-ink-muted">
        {t("adaptive.explanation")}
      </p>
    </Card>
  );
}
