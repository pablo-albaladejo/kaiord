/**
 * The editor's one delivery surface: what the watch has, what it is missing,
 * and the single control that closes the gap.
 *
 * It replaces `EditorWorkflowBar` (Accept / Push) and `ModifiedIndicator`
 * (Re-push) — three buttons for one intention, none of which could be seen
 * at the same time as another. A Connection that does not work shows its own
 * notice, the words its Garmin card and popup show, and its one fix runs
 * from here; only the route switch lives on the Connections page.
 */

import { useLocation } from "wouter";

import { useGarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutState } from "../../../types/calendar-enums";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { GarminPushButton } from "../../molecules/GarminPushButton";
import { needsAthlete } from "../../molecules/GarminPushButton/placement-message";
import { resolveRibbonContent } from "./ribbon-content";
import { RibbonNoticePanel } from "./RibbonNoticePanel";
import { RibbonPanel } from "./RibbonPanel";
import { useGarminGate } from "./use-garmin-gate";

const CONNECTIONS_ROUTE = "/connections";

export type EditorStateRibbonProps = {
  state: WorkoutState;
  /** The workout's record id, and its Garmin ledger row as the page read
      it: the source of its placement notice. */
  recordId?: string;
  placementRow?: ExportLedgerEntry;
  /** The workout's date: a success naming another date is not shown. */
  workoutDate?: string;
  profileId?: string;
  /** Persists the state transition with the Garmin library workout id,
      once the library push is confirmed. */
  onSent: (garminWorkoutId: string) => void;
};

export function EditorStateRibbon({
  state,
  recordId,
  placementRow,
  workoutDate,
  profileId,
  onSent,
}: EditorStateRibbonProps) {
  const t = useTranslate("editor");
  const [, navigate] = useLocation();
  const gate = useGarminGate(profileId);
  const notice = useGarminPlacementNotice(recordId, placementRow, workoutDate);
  const content = resolveRibbonContent(gate, state, needsAthlete(notice));

  if (!content) return null;
  if (content.connection !== undefined) {
    return (
      <RibbonNoticePanel
        connection={content.connection}
        regionLabel={t("ribbon.region")}
      />
    );
  }

  return (
    <RibbonPanel
      content={content}
      headline={t(content.headlineKey)}
      detail={t(content.detailKey)}
      regionLabel={t("ribbon.region")}
      fixLabel={content.fixLabelKey ? t(content.fixLabelKey) : undefined}
      onFix={() => navigate(CONNECTIONS_ROUTE)}
      action={
        gate === "ready" ? (
          <GarminPushButton notice={notice} onSent={onSent} />
        ) : undefined
      }
    />
  );
}
