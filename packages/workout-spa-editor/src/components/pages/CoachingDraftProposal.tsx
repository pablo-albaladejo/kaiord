import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useTranslate } from "../../i18n/use-translate";
import { thresholdsForSport } from "../../lib/athlete";
import { buildReviewModel } from "../../lib/workout-review";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/krd";
import type { ProposalMetric } from "../molecules/SessionProposalCard";
import { SessionProposalCard } from "../molecules/SessionProposalCard";

export type CoachingDraftProposalProps = {
  activity: CoachingActivityRecord | undefined;
  krd: KRD | null;
};

/**
 * The coaching draft as it arrives: its zone profile, and what the coach
 * prescribed beneath what the draft actually structures to. `duration` and
 * `workload` are the coach's own values, preserved verbatim on the activity
 * record, so the comparison is real rather than derived twice from the KRD.
 */
export function CoachingDraftProposal({
  activity,
  krd,
}: CoachingDraftProposalProps) {
  const t = useTranslate("chat");
  const profile = useActiveProfileLive()?.profile ?? null;

  if (!activity || !krd) return null;
  const thresholds = thresholdsForSport(profile, activity.sport);
  const model = buildReviewModel(krd, thresholds, activity.title);
  if (!model) return null;

  const metrics: ProposalMetric[] = [
    {
      value: model.duration,
      was: activity.duration
        ? t("proposal.coachSaid", { value: activity.duration })
        : undefined,
      label: t("proposal.duration"),
    },
    {
      value: String(model.tss),
      was:
        activity.workload === undefined
          ? undefined
          : t("proposal.coachSaid", { value: activity.workload }),
      label: t("proposal.tss"),
    },
  ];

  return (
    <SessionProposalCard
      title={model.title}
      subtitle={t("proposal.fromYourCoach")}
      metrics={metrics}
      dist={model.dist}
    />
  );
}
