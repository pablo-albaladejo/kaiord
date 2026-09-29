import type { PlacementResult } from "../../../application/garmin-placement/placement-result";
import { useSecondsLeft } from "../../../hooks/use-seconds-left";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

type Uncertain = Extract<PlacementResult, { kind: "uncertain" }>;

export type UncertainActionsProps = {
  result: Uncertain;
  onConfirm: () => void;
  onSendAnyway: () => void;
};

/** "It's in Garmin" and "Send anyway", held until a posted attempt's gate:
    its POST may still land, so neither answer is safe before it. */
export const UncertainActions: React.FC<UncertainActionsProps> = (props) => {
  const { result, onConfirm, onSendAnyway } = props;
  const t = useTranslate("workout-detail");
  const seconds = useSecondsLeft(result.sendAfter);
  const waiting = seconds > 0;
  return (
    <>
      {waiting && (
        <span className="text-ink-muted">
          {t("placement.checking", { seconds })}
        </span>
      )}
      {result.canConfirm && (
        <Button
          size="sm"
          variant="secondary"
          disabled={waiting}
          onClick={onConfirm}
        >
          {t("placement.confirm")}
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={waiting}
        onClick={onSendAnyway}
      >
        {t("placement.sendAnyway")}
      </Button>
    </>
  );
};
