/**
 * DataFlowsAddFields — form fields for DataFlowsAddDialog.
 */
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";

const MODES = ["manual", "auto"] as const;

type Props = {
  eligible: readonly string[];
  discoveredBridges: readonly DiscoveredBridge[];
  bridgeId: string;
  setBridgeId: (v: string) => void;
  mode: "manual" | "auto";
  setMode: (v: "manual" | "auto") => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

export function DataFlowsAddFields({
  eligible,
  discoveredBridges,
  bridgeId,
  setBridgeId,
  mode,
  setMode,
  enabled,
  setEnabled,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium">
        Bridge
        <select
          value={bridgeId}
          onChange={(e) => setBridgeId(e.target.value)}
          className="mt-1 block w-full rounded border px-2 py-1 text-xs"
        >
          {eligible.map((id) => {
            const disc = discoveredBridges.some((b) => b.bridgeId === id);
            return (
              <option key={id} value={id}>
                {id}
                {!disc ? " (not installed)" : ""}
              </option>
            );
          })}
        </select>
      </label>
      <label className="block text-xs font-medium">
        Mode
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "manual" | "auto")}
          className="mt-1 block w-full rounded border px-2 py-1 text-xs"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enabled
      </label>
    </div>
  );
}
