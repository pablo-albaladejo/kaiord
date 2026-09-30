import { Link } from "wouter";

import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import type { GarminRemovalEntry } from "../../../types/garmin-removal-entry";
import { AttentionMark } from "../../atoms/AttentionMark";
import { Button } from "../../atoms/Button";
import { formatDateLabel } from "../TemplatePickerDialog/format-date-label";
import { placementMessage, type PlacementTone } from "./placement-message";
import { UncertainActions } from "./UncertainActions";

const CONNECTIONS_HREF = "/settings/connections";

export const GARMIN_BRIDGE_STORE_URL =
  "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";

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
  const text = t(message.key, {
    date: message.date ? day(message.date) : "",
    dates: (message.dates ?? []).map(day).join(", "),
  });
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {message.tone === "warning" && <AttentionMark size="xs" />}
      <span className={TONE_CLASS[message.tone]} role="status">
        {text}
      </span>
      {result.kind === "uncertain" && (
        <UncertainActions
          result={result}
          onConfirm={onConfirm}
          onSendAnyway={onSendAnyway}
        />
      )}
      {result.kind === "library-only" &&
        result.reason === "bridge-outdated" && (
          <a
            className="underline"
            href={GARMIN_BRIDGE_STORE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t("placement.updateExtension")}
          </a>
        )}
      {result.kind === "failed" && result.reason === "no-export-route" && (
        <Link className="underline" href={CONNECTIONS_HREF}>
          {t("placement.openConnections")}
        </Link>
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
