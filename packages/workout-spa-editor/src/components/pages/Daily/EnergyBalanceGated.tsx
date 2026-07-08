import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

const PROFILE_HREF = "/settings/profile";

/**
 * Shown when the day has no measured wellness and the profile lacks the
 * physiological fields BMR estimation needs. Prompts the user to complete
 * their profile rather than displaying a basal-derived number.
 */
export function EnergyBalanceGated() {
  const t = useTranslate("daily");
  return (
    <Link
      href={PROFILE_HREF}
      data-testid="energy-balance-gated"
      className="block"
    >
      <Card className="bg-primary-900 border-slate-800 p-4 transition-colors hover:border-slate-700">
        <div className="flex items-center gap-3">
          <Icon icon={ICON_MAP.flame} size="md" color="inherit" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-slate-100 m-0">
              {t("energyBalance.title")}
            </p>
            <p className="text-[13px] text-slate-400 m-0 mt-0.5">
              {t("energyBalance.gatedPrompt")}
            </p>
          </div>
          <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
        </div>
      </Card>
    </Link>
  );
}
