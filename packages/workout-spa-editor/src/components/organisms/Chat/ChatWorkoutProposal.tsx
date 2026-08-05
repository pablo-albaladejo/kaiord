import { useProposedSession } from "../../../hooks/use-proposed-session";
import { useTranslate } from "../../../i18n/use-translate";
import type { ProposalMetric } from "../../molecules/SessionProposalCard/SessionProposalCard";
import { SessionProposalCard } from "../../molecules/SessionProposalCard/SessionProposalCard";

/** Mounted only where a `create_workout` result really exists, so the live
    query below runs once per proposal instead of once per transcript row —
    every write to `workouts` re-runs each subscription. */
export type ChatWorkoutProposalProps = { workoutId: string };

/** The session a confirmed `create_workout` wrote, beside the one that was
    already on that date. */
export function ChatWorkoutProposal({ workoutId }: ChatWorkoutProposalProps) {
  const t = useTranslate("chat");
  const session = useProposedSession(workoutId, t("proposal.untitled"));

  if (!session) return null;

  const previous = session.previous;
  const metrics: ProposalMetric[] = [
    {
      value: session.duration,
      comparison: previous
        ? t("proposal.alreadyThere", { value: previous.duration })
        : undefined,
      label: t("proposal.duration"),
    },
    {
      value: String(session.tss),
      comparison: previous
        ? t("proposal.alreadyThere", { value: previous.tss })
        : undefined,
      label: t("proposal.tss"),
    },
  ];

  return (
    <div className="mt-2">
      <SessionProposalCard
        title={session.title}
        subtitle={
          previous
            ? t("proposal.landsBeside", { title: previous.title })
            : undefined
        }
        metrics={metrics}
        dist={session.dist}
      />
    </div>
  );
}
