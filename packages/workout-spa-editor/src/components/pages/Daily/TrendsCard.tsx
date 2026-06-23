import { Link } from "wouter";

import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export function TrendsCard() {
  return (
    <Link href="/health" data-testid="daily-trends-card" className="block">
      <Card className="bg-primary-900 border-slate-800 p-4 transition-colors hover:border-slate-700">
        <div className="flex items-center gap-3">
          <Icon icon={ICON_MAP.trend} size="md" color="inherit" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-slate-100 m-0">
              Trends
            </p>
            <p className="text-[13px] text-slate-400 m-0 mt-0.5">
              See your wellness history
            </p>
          </div>
          <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
        </div>
      </Card>
    </Link>
  );
}
