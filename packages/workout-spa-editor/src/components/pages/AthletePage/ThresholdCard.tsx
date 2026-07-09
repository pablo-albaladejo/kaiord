import { useState } from "react";

import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import { type ActiveSport, deriveThresholdMetrics } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { ThresholdCardHeader } from "./ThresholdCardHeader";
import { ThresholdEditDialog } from "./ThresholdEditDialog";
import { ThresholdMetricsRow } from "./ThresholdMetricsRow";

type ThresholdCardProps = {
  profile: Profile;
  profileId: string;
  sport: ActiveSport;
  sportLabel: string;
};

export function ThresholdCard({
  profile,
  profileId,
  sport,
  sportLabel,
}: ThresholdCardProps) {
  const t = useTranslate("athlete");
  const [auto, setAuto] = useState(true);
  const [editing, setEditing] = useState(false);
  const units = useUnits();
  const metrics = deriveThresholdMetrics(profile, sport, units);

  return (
    <Card className="rounded-[20px] border border-slate-700/60 bg-surface p-4">
      <ThresholdCardHeader auto={auto} onAutoChange={setAuto} />
      <div className="my-4">
        <ThresholdMetricsRow metrics={metrics} sportLabel={sportLabel} />
      </div>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => setEditing(true)}
      >
        <Icon
          icon={ICON_MAP.edit}
          size="sm"
          color="inherit"
          strokeWidth={1.9}
        />
        {t("editThresholds")}
      </Button>
      <ThresholdEditDialog
        open={editing}
        profileId={profileId}
        onClose={() => setEditing(false)}
      />
    </Card>
  );
}
