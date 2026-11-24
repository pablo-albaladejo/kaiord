import { Link } from "wouter";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import type { GarminRemovalEntry } from "../../../types/garmin-removal-entry";
import { AttentionMark } from "../../atoms/AttentionMark";
import { Button } from "../../atoms/Button";
import { GarminConnectionNotice } from "../ConnectionNotice/GarminConnectionNotice";
import { formatDateLabel } from "../TemplatePickerDialog/format-date-label";
import {
  placementConnection,
  placementMessage,
  type PlacementTone,
} from "./placement-message";
import { ReloadAppButton } from "./ReloadAppButton";
import { UncertainActions } from "./UncertainActions";

const CONNECTIONS_HREF = "/connections";

export type PlacementFeedbackProps = {
  result: PlacementResult;
  /** The workout's date, `YYYY-MM-DD`. */
  date: string;
  /** Abandoned entries the athlete may say they removed. */
  removable: GarminRemovalEntry[];
  onConfirm: () => void;
  onSendAnyway: () => void;
  onDismiss: (workoutScheduleId: string) => void;
};

const TONE_CLASS: Record<PlacementTone, string> = {
  plain: "text-ink-muted",
  warning: "text-ink-strong",
  danger: "text-[var(--danger-text)]",
};

/** The outcome of a Garmin push, and what the athlete can do about it. */
export const PlacementFeedback: React.FC<PlacementFeedbackProps> = (props) => {
  const { result, removable, onConfirm, onSendAnyway, onDismiss } = props;
  const t = useTranslate("workout-detail");
  const locale = useActiveLocale();
  const day = (d: string) => formatDateLabel(d, locale);
  const message = placementMessage(result, props.date);
  const connection = placementConnection(result);
  const text = t(message.key, {
    date: message.date ? day(message.date) : "",
    dates: (message.dates ?? []).map(day).join(", "),
  });
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {message.tone === "warning" && <AttentionMark size="xs" />}
      {(connection === null || result.kind === "library-only") && (
        <span className={TONE_CLASS[message.tone]} role="status">
          {text}
        </span>
      )}
      {connection !== null && (
        <GarminConnectionNotice connection={connection} />
      )}
      {result.kind === "uncertain" && (
        <UncertainActions
          result={result}
          onConfirm={onConfirm}
          onSendAnyway={onSendAnyway}
        />
      )}
      {result.kind === "failed" && result.reason === "no-export-route" && (
        <Link className="underline" href={CONNECTIONS_HREF}>
          {t("placement.openConnections")}
        </Link>
      )}
      {result.kind === "failed" && result.reason === "app-part-not-loaded" && (
        <ReloadAppButton />
      )}
      {removable.map((e) => (
        <Button
          key={e.workoutScheduleId}
          size="sm"
          variant="secondary"
          onClick={() => onDismiss(e.workoutScheduleId)}
        >
          {t("placement.removed", { date: day(e.date) })}
        </Button>
      ))}
    </div>
  );
};
