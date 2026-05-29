/**
 * DataFlowsRow — one policy row: mode dropdown, enabled checkbox, remove button.
 * Bridge is read-only after creation (natural-key constraint); switching
 * requires remove + add.
 */
import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../../adapters/dexie/dexie-integration-policy-repository";
import { deleteIntegrationPolicy } from "../../../../application/integration-policy/delete-integration-policy.use-case";
import { upsertIntegrationPolicy } from "../../../../application/integration-policy/upsert-integration-policy.use-case";
import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicy } from "../../../../types/integration-policy";

const policyRepo = createDexieIntegrationPolicyRepository(db);
const deps = { policyRepo };

const MODES = ["manual", "auto"] as const;

type Props = {
  policy: IntegrationPolicy;
  allBridges: readonly DiscoveredBridge[];
};

export function DataFlowsRow({ policy, allBridges }: Props) {
  const isInstalled = allBridges.some((b) => b.bridgeId === policy.bridgeId);

  const handleMode = async (mode: "manual" | "auto") => {
    await upsertIntegrationPolicy(deps, { ...policy, mode });
  };

  const handleEnabled = async (enabled: boolean) => {
    await upsertIntegrationPolicy(deps, { ...policy, enabled });
  };

  const handleRemove = async () => {
    await deleteIntegrationPolicy(deps, { id: policy.id });
  };

  return (
    <div
      data-testid={`data-flows-row-${policy.id}`}
      className={`flex items-center gap-3 rounded border p-2 text-sm ${policy.enabled ? "" : "opacity-50"}`}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-xs">
        {policy.bridgeId}
        {!isInstalled && (
          <span className="ml-1 text-gray-400">(not installed)</span>
        )}
      </span>
      <select
        value={policy.mode}
        onChange={(e) => void handleMode(e.target.value as "manual" | "auto")}
        className="rounded border px-1 py-0.5 text-xs"
        aria-label="mode"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input
        type="checkbox"
        checked={policy.enabled}
        onChange={(e) => void handleEnabled(e.target.checked)}
        aria-label="enabled"
      />
      <button
        type="button"
        onClick={() => void handleRemove()}
        className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
        aria-label="remove"
      >
        −
      </button>
    </div>
  );
}
