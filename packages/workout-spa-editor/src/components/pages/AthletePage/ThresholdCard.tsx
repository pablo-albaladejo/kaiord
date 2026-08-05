import { useState } from "react";

import { useUnits } from "../../../contexts/units-context";
import { useApplyThreshold } from "../../../hooks/athlete/use-apply-threshold";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  deriveThresholdDisagreement,
  deriveThresholdMetrics,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { logger } from "../../../utils/logger";
import { Card } from "../../atoms/Card";
import { SectionHead } from "../../molecules/SectionHead";
import { ThresholdAutoRow } from "./ThresholdAutoRow";
import { ThresholdEditDialog } from "./ThresholdEditDialog";
import { ThresholdMetricsRow } from "./ThresholdMetricsRow";
import { ThresholdReconcileRow } from "./ThresholdReconcileRow";

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
  const [editing, setEditing] = useState(false);
  // Keeping the current number is a preference nothing records, so the
  // dismissal lives exactly as long as the claim it answers: this session.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const units = useUnits();
  const applyThreshold = useApplyThreshold(profileId, sport);

  const metrics = deriveThresholdMetrics(profile, sport, units);
  const disagreement = deriveThresholdDisagreement(profile, sport, units);
  // Keyed by field AND sync, so keeping one number does not also silence a
  // second disagreement that arrived in the same snapshot.
  const key = disagreement && `${disagreement.field}@${disagreement.at}`;
  const pending = key === dismissed ? null : disagreement;

  const handleUse = () => {
    if (!pending) return;
    void applyThreshold(pending.field, pending.incomingRaw).catch(
      (error: unknown) => {
        logger.warn("Failed to apply the source's threshold", { error });
      }
    );
  };

  return (
    <div>
      <SectionHead
        title={t("thresholdsTitle", { sport: sportLabel })}
        action={t("edit")}
        onAction={() => setEditing(true)}
      />
      <Card className="flex flex-col gap-4 p-4">
        <ThresholdMetricsRow metrics={metrics} sportLabel={sportLabel} />
        {pending && (
          <ThresholdReconcileRow
            disagreement={pending}
            onUse={handleUse}
            onKeep={() => setDismissed(key)}
          />
        )}
        <ThresholdAutoRow profileId={profileId} />
      </Card>
      <ThresholdEditDialog
        open={editing}
        profileId={profileId}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}
