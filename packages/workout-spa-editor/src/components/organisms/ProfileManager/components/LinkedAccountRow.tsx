/**
 * LinkedAccountRow — single row in `LinkedAccountsSection`.
 *
 * Renders the connect/disconnect button. The SyncZonesToggle has been
 * removed in PR 5; the Data Flows section (PR 6) is the replacement.
 */
import { useTranslate } from "../../../../i18n/use-translate";
import type { Profile } from "../../../../types/profile";
import { Button } from "../../../atoms/Button";
import { ExtensionInstallLink } from "../../Connections/ExtensionInstallLink";
import { RowInfo } from "./RowInfo";
import type { SourceMeta } from "./use-linked-account-row";
import { useLinkedAccountRow } from "./use-linked-account-row";

export function LinkedAccountRow({
  profile,
  sourceMeta,
}: {
  profile: Profile;
  sourceMeta: SourceMeta;
}) {
  const t = useTranslate("athlete");
  const tConnections = useTranslate("connections");
  const linked = profile.linkedAccounts.find((a) => a.source === sourceMeta.id);
  const { busy, extensionMissing, handleConnect, handleDisconnect } =
    useLinkedAccountRow(profile, sourceMeta);

  return (
    <div
      data-testid={`linked-account-row-${sourceMeta.id}`}
      className="flex flex-col gap-2 rounded border border-edge p-3"
    >
      <div className="flex items-center justify-between">
        <RowInfo label={sourceMeta.label} linked={linked} />
        {linked ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleDisconnect}
            className="rounded-md border border-edge px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            {t("profileManager.disconnect")}
          </button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={handleConnect}
          >
            {busy
              ? t("profileManager.connecting")
              : t("profileManager.connect", { source: sourceMeta.label })}
          </Button>
        )}
      </div>
      {!linked && extensionMissing && (
        <p
          data-testid={`linked-account-extension-${sourceMeta.id}`}
          className="flex flex-wrap items-center gap-x-3 text-xs text-ink-muted"
        >
          {tConnections("ext.requires")}
          <ExtensionInstallLink />
        </p>
      )}
    </div>
  );
}
