/**
 * LinkedAccountRow — single row in `LinkedAccountsSection`.
 *
 * Renders the connect/disconnect button + the optional `Sync zones`
 * toggle. The toggle is gated on TWO conditions: the row is currently
 * `linked`, AND the discovered Train2Go bridge advertises
 * `read:training-zones`. Older bridges never see the control.
 */
import { useTrain2GoSupportsZones } from "../../../../hooks/use-train2go-supports-zones";
import type { Profile } from "../../../../types/profile";
import { ZonesConflictDialog } from "../../ZonesConflictDialog/ZonesConflictDialog";
import { RowInfo } from "./RowInfo";
import { SyncZonesToggle } from "./SyncZonesToggle";
import { type SourceMeta, useLinkedAccountRow } from "./use-linked-account-row";

export function LinkedAccountRow({
  profile,
  sourceMeta,
}: {
  profile: Profile;
  sourceMeta: SourceMeta;
}) {
  const linked = profile.linkedAccounts.find((a) => a.source === sourceMeta.id);
  const {
    busy,
    handleConnect,
    handleDisconnect,
    handleToggleSyncZones,
    zonesSync,
  } = useLinkedAccountRow(profile, sourceMeta);
  const supportsZones = useTrain2GoSupportsZones();

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
      {linked && supportsZones ? (
        <SyncZonesToggle
          sourceId={sourceMeta.id}
          checked={linked.syncZones === true}
          onChange={handleToggleSyncZones}
        />
      ) : null}
      <ZonesConflictDialog
        open={zonesSync.pending !== null}
        conflicts={zonesSync.pending?.conflicts ?? []}
        onConfirm={zonesSync.confirmDecisions}
        onCancel={zonesSync.cancel}
      />
    </div>
  );
}
