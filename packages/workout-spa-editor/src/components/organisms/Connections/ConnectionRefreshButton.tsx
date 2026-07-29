import { useConnectionsRefresh } from "../../../hooks/connections/use-connections-refresh";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

/**
 * One forced pass over every bridge, replacing the old control that only
 * re-detected two of them. The refusal is reported rather than swallowed: a
 * button that silently does nothing reads as broken.
 */
export function ConnectionRefreshButton() {
  const t = useTranslate("connections");
  const refresh = useConnectionsRefresh();
  const running = refresh.status === "running";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={running}
        onClick={refresh.run}
        data-testid="connections-refresh"
      >
        {running ? t("summary.refreshing") : t("summary.refresh")}
      </Button>
      {refresh.status === "cooldown" && (
        <p
          role="status"
          className="text-[12px] text-ink-muted"
          data-testid="connections-refresh-feedback"
        >
          {t("summary.refreshCooldown")}
        </p>
      )}
    </div>
  );
}
