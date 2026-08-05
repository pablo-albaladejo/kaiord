/**
 * The editor's one delivery surface: what the watch has, what it is missing,
 * and the single control that closes the gap.
 *
 * It replaces `EditorWorkflowBar` (Accept / Push) and `ModifiedIndicator`
 * (Re-push) — three buttons for one intention, none of which could be seen
 * at the same time as another. Every fix lives on the Connections page,
 * where the bridge and its routes already live (principle 5).
 */

import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutState } from "../../../types/calendar-enums";
import { GarminPushButton } from "../../molecules/GarminPushButton";
import { resolveRibbonContent } from "./ribbon-content";
import { RibbonPanel } from "./RibbonPanel";
import { useGarminGate } from "./use-garmin-gate";

const CONNECTIONS_ROUTE = "/settings/connections";

export type EditorStateRibbonProps = {
  state: WorkoutState;
  profileId?: string;
  /** Persists the state transition once the bridge confirms the send. */
  onSent: () => void;
};

export function EditorStateRibbon({
  state,
  profileId,
  onSent,
}: EditorStateRibbonProps) {
  const t = useTranslate("editor");
  const [, navigate] = useLocation();
  const gate = useGarminGate(profileId);
  const content = resolveRibbonContent(gate, state);

  if (!content) return null;

  return (
    <RibbonPanel
      content={content}
      headline={t(content.headlineKey)}
      detail={t(content.detailKey)}
      regionLabel={t("ribbon.region")}
      fixLabel={content.fixLabelKey ? t(content.fixLabelKey) : undefined}
      onFix={() => navigate(CONNECTIONS_ROUTE)}
      action={
        gate === "ready" ? <GarminPushButton onSent={onSent} /> : undefined
      }
    />
  );
}
