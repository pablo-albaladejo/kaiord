import type { TanitaGarminSyncStatus } from "../../../hooks/use-tanita-garmin-sync";
import { useTanitaGarminSync } from "../../../hooks/use-tanita-garmin-sync";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

const IN_FLIGHT: readonly TanitaGarminSyncStatus[] = [
  "reading",
  "parsing",
  "encoding",
  "uploading",
];

type Props = { sourceId: string; profileId: string };

/**
 * The manual Tanita → Garmin body-composition push, which used to be a card of
 * its own on the Extensions tab.
 *
 * It renders on the Tanita card only. Both ends of the route are named already
 * — the Garmin card lists Body Composition under "Kaiord sends back" — and one
 * button per card would mean two independent copies of this state machine, both
 * clickable while both Manage panels are open, with nothing downstream to
 * collapse the second upload or its ledger row.
 *
 * `canSync` still requires BOTH bridges, so the button on the Tanita card is
 * disabled while Garmin is missing rather than failing at the push.
 */
export function ConnectionBodyExport({ sourceId, profileId }: Props) {
  const t = useTranslate("connections");
  const { status, lastError, canSync, sync } = useTanitaGarminSync(profileId);

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="secondary"
        loading={IN_FLIGHT.includes(status)}
        disabled={!canSync}
        data-testid={`connection-body-export-${sourceId}`}
        onClick={() => void sync()}
      >
        {t("manage.bodyExport")}
      </Button>
      <p className="text-[12px] text-ink-muted" role="status">
        {t(`manage.bodyExportStatus.${status}`)}
      </p>
      {status === "error" && lastError !== null && (
        <p className="text-[12px] text-[var(--danger-text)]">{lastError}</p>
      )}
    </div>
  );
}
