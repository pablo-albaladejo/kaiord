import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

const ATHLETE_HREF = "/athlete";

/** Shown when no athlete profile is active; intake needs a profile to log to. */
export function NutritionEmptyState() {
  const t = useTranslate("nutrition");
  return (
    <div className="px-4 py-4" data-testid="nutrition-empty">
      <Link href={ATHLETE_HREF} className="block">
        <Card className="border-edge bg-surface p-4 transition-colors hover:border-edge">
          <div className="flex items-center gap-3">
            <Icon icon={ICON_MAP.nutrition} size="md" color="inherit" />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[15px] font-semibold text-ink-strong">
                {t("empty.title")}
              </p>
              <p className="m-0 mt-0.5 text-[13px] text-ink-muted">
                {t("empty.body")}
              </p>
            </div>
            <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
