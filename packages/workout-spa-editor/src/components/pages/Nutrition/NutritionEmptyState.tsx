import { Link } from "wouter";

import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

const ATHLETE_HREF = "/athlete";

/** Shown when no athlete profile is active; intake needs a profile to log to. */
export function NutritionEmptyState() {
  return (
    <div className="px-4 py-4" data-testid="nutrition-empty">
      <Link href={ATHLETE_HREF} className="block">
        <Card className="border-slate-800 bg-primary-900 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-center gap-3">
            <Icon icon={ICON_MAP.nutrition} size="md" color="inherit" />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[15px] font-semibold text-slate-100">
                Nutrition
              </p>
              <p className="m-0 mt-0.5 text-[13px] text-slate-400">
                Create an athlete profile to start logging intake
              </p>
            </div>
            <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
