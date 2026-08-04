import { useProposedSession } from "../../../hooks/use-proposed-session";
import { useTranslate } from "../../../i18n/use-translate";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import type { ProposalMetric } from "../../molecules/SessionProposalCard";
import { SessionProposalCard } from "../../molecules/SessionProposalCard";
import { proposedWorkoutId } from "./build-tool-result-links";

export type ChatWorkoutProposalProps = { message: ChatMessageRecord };

/** Renders the session a confirmed `create_workout` wrote, with the session
    already on that date as its before. Nothing for any other tool event. */
export function ChatWorkoutProposal({ message }: ChatWorkoutProposalProps) {
  const t = useTranslate("chat");
  const workoutId = proposedWorkoutId(message);
  const session = useProposedSession(workoutId ?? "", t("proposal.untitled"));

  if (!session) return null;

  const metrics: ProposalMetric[] = [
    {
      value: session.duration,
      was: session.previous
        ? t("proposal.was", { value: session.previous.duration })
        : undefined,
      label: t("proposal.duration"),
    },
    {
      value: String(session.tss),
      was: session.previous
        ? t("proposal.wasTss", { value: session.previous.tss })
        : undefined,
      label: t("proposal.tss"),
    },
  ];

  return (
    <div className="mt-2">
      <SessionProposalCard
        title={session.title}
        subtitle={
          session.previous
            ? t("proposal.landsBeside", { title: session.previous.title })
            : undefined
        }
        metrics={metrics}
        dist={session.dist}
      />
    </div>
  );
}
