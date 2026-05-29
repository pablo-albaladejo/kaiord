/**
 * LinkedAccountRow — single row in `LinkedAccountsSection`.
 *
 * Renders the connect/disconnect button. The SyncZonesToggle has been
 * removed in PR 5; the Data Flows section (PR 6) is the replacement.
 */
import type { Profile } from "../../../../types/profile";
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
  const linked = profile.linkedAccounts.find((a) => a.source === sourceMeta.id);
  const { busy, handleConnect, handleDisconnect } = useLinkedAccountRow(
    profile,
    sourceMeta
  );

  return (
    <div
      data-testid={`linked-account-row-${sourceMeta.id}`}
      className="flex flex-col gap-2 rounded border p-3"
    >
      <div className="flex items-center justify-between">
        <RowInfo label={sourceMeta.label} linked={linked} />
        {linked ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleDisconnect}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleConnect}
            className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? "Connecting…" : `Connect ${sourceMeta.label}`}
          </button>
        )}
      </div>
    </div>
  );
}
