import { useState } from "react";

import { useUnits } from "../../../contexts/units-context";
import { useApplyThreshold } from "../../../hooks/athlete/use-apply-threshold";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  deriveThresholdDisagreement,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { logger } from "../../../utils/logger";
import { Card } from "../../atoms/Card";
import { SectionHead } from "../../molecules/SectionHead";
import { ThresholdAutoRow } from "./ThresholdAutoRow";
import { ThresholdFields } from "./ThresholdFields";
import { ThresholdReconcileRow } from "./ThresholdReconcileRow";
import { useThresholdWrites } from "./use-threshold-writes";

type ThresholdCardProps = {
  profile: Profile;
  profileId: string;
  sport: ActiveSport;
  sportLabel: string;
};

/* The thresholds are edited here, in place; their zones have one editor of
   their own at /athlete/zones/:sport (audit P-01). */
export function ThresholdCard({
  profile,
  profileId,
  sport,
  sportLabel,
}: ThresholdCardProps) {
  const t = useTranslate("athlete");
  // Keeping the current number is a preference nothing records, so the
  // dismissal lives exactly as long as the claim it answers: this session.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const units = useUnits();
  const hrUnit = useTranslate("common")("units.hr");
  const applyThreshold = useApplyThreshold(profileId, sport);
  const { saved, write } = useThresholdWrites(profileId, sport);

  const disagreement = deriveThresholdDisagreement(
    profile,
    sport,
    units,
    hrUnit
  );
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
    <div data-testid="athlete-thresholds">
      <SectionHead title={t("thresholdsTitle", { sport: sportLabel })} />
      <Card className="flex flex-col gap-4 p-4">
        <ThresholdFields
          key={sport}
          profile={profile}
          sport={sport}
          onSave={(spec, value) => write(spec.id, value)}
        />
        <p role="status" className="m-0 h-4 text-[13px] text-ink-muted">
          {saved ? t("thresholds.saved") : ""}
        </p>
        {pending && (
          <ThresholdReconcileRow
            disagreement={pending}
            onUse={handleUse}
            onKeep={() => setDismissed(key)}
          />
        )}
        <ThresholdAutoRow profileId={profileId} />
      </Card>
    </div>
  );
}
