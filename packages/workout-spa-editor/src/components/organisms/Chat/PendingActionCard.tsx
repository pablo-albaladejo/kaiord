import type { PendingAction } from "@kaiord/ai";

import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

const ACTION_LABEL_KEY: Record<string, string> = {
  sync_coaching: "action.sync_coaching",
  create_workout: "action.create_workout",
  log_health_metric: "action.log_health_metric",
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
  const t = useTranslate("chat");
  const actionKey = ACTION_LABEL_KEY[action.toolName];
  const label = actionKey ? t(actionKey) : action.toolName;
  return (
    <div className="rounded-2xl border border-edge-strong bg-surface-elevated p-3">
      <p className="text-[13px] font-semibold text-ink-strong">
        {t("pendingAction.confirm", { action: label })}
      </p>
      <pre className="my-2 overflow-x-auto rounded-lg bg-surface-deep p-2 text-[12px] text-ink-body">
        {JSON.stringify(action.input, null, 2)}
      </pre>
      {action.deferredCount !== undefined && action.deferredCount > 0 && (
        <p className="mb-2 text-[12px] text-ink-muted">
          {t(pluralKey("pendingAction.deferred", action.deferredCount), {
            count: action.deferredCount,
          })}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={onApprove} disabled={busy}>
          {t("pendingAction.approve")}
        </Button>
        <button
          type="button"
          onClick={onDeny}
          disabled={busy}
          className="rounded-xl px-3 py-1.5 text-[13px] text-ink-body hover:text-ink-strong disabled:opacity-50"
        >
          {t("pendingAction.decline")}
        </button>
      </div>
    </div>
  );
}
