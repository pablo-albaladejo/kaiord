import type { PendingAction } from "@kaiord/ai";

import { Button } from "../../atoms/Button";

const ACTION_LABEL: Record<string, string> = {
  sync_coaching: "Sync coaching activities",
  create_workout: "Create a workout",
  log_health_metric: "Log a health metric",
};

export type PendingActionCardProps = {
  action: PendingAction;
  onApprove: () => void;
  onDeny: () => void;
  busy: boolean;
};

/** Inline confirmation for an action the assistant proposed. Nothing runs
 * until the user approves. */
export function PendingActionCard({
  action,
  onApprove,
  onDeny,
  busy,
}: PendingActionCardProps) {
  return (
    <div className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-3">
      <p className="text-[13px] font-semibold text-amber-200">
        Confirm: {ACTION_LABEL[action.toolName] ?? action.toolName}
      </p>
      <pre className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-2 text-[12px] text-slate-300">
        {JSON.stringify(action.input, null, 2)}
      </pre>
      <div className="flex gap-2">
        <Button onClick={onApprove} disabled={busy}>
          Approve
        </Button>
        <button
          type="button"
          onClick={onDeny}
          disabled={busy}
          className="rounded-xl px-3 py-1.5 text-[13px] text-slate-300 hover:text-slate-100 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
