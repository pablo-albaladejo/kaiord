/**
 * SyncZonesToggle — checkbox bound to `linkedAccounts[i].syncZones`.
 *
 * Lives in its own file so the parent row stays under the editor's
 * 80-line component cap. The label is derived from `sourceId` (NOT
 * from any externally-provided string) — keeps the XSS surface zero.
 */
type Props = {
  sourceId: string;
  checked: boolean;
  onChange: (next: boolean) => void | Promise<void>;
};

const sourceLabel = (id: string): string =>
  id === "train2go" ? "Train2Go" : id;

export const SyncZonesToggle = ({ sourceId, checked, onChange }: Props) => (
  <label
    data-testid={`sync-zones-toggle-${sourceId}`}
    className="flex items-center gap-2 text-xs text-muted-foreground"
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => void onChange(e.target.checked)}
      className="h-4 w-4"
    />
    Sync zones from {sourceLabel(sourceId)}
  </label>
);
