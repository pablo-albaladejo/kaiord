import { useLocation } from "wouter";

import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export function PlannedEmpty() {
  const [, navigate] = useLocation();

  return (
    <Card className="bg-primary-900 border-slate-800 p-6 text-center">
      <p className="text-[15px] font-semibold text-slate-300 m-0">
        Nothing planned today
      </p>
      <p className="text-[13px] text-slate-500 m-0 mt-1">
        Create a workout to fill your day.
      </p>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => navigate("/workout/new")}
      >
        <Icon icon={ICON_MAP.plus} size="sm" color="inherit" />
        Plan a session
      </Button>
    </Card>
  );
}
