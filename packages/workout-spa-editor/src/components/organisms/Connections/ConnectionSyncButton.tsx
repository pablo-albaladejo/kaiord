import type { BridgeImport } from "../../../hooks/connections/use-bridge-import";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

type Props = { sourceId: string; state: BridgeImport };

const FEEDBACK_KEY: Partial<Record<BridgeImport["status"], string>> = {
  done: "manage.syncDone",
  failed: "manage.syncFailed",
  cooldown: "manage.syncCooldown",
};

/**
 * Rendered only where a pull is genuinely callable. `train2go-bridge` has no
 * entry in the importer map — its import is week-scoped — so its card shows
 * no button at all rather than one that would do nothing.
 */
export function ConnectionSyncButton({ sourceId, state }: Props) {
  const t = useTranslate("connections");
  if (!state.supported) return null;

  const running = state.status === "running";
  const feedback = FEEDBACK_KEY[state.status];

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={running}
        onClick={state.run}
        data-testid={`connection-sync-${sourceId}`}
      >
        {running ? t("manage.syncing") : t("manage.syncNow")}
      </Button>
      {feedback !== undefined && (
        <p
          className="text-[12px] text-ink-muted"
          data-testid={`connection-sync-feedback-${sourceId}`}
          role="status"
        >
          {t(feedback)}
        </p>
      )}
    </div>
  );
}
