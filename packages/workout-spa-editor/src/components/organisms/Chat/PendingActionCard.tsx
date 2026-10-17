import type { PendingAction } from "@kaiord/ai";
import { Globe } from "lucide-react";

import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { PushToGarminSummary } from "./PushToGarminSummary";
import { usePendingActionView } from "./use-pending-action-view";

export type PendingActionCardProps = {
  action: PendingAction;
  onApprove: () => void;
  onDeny: () => void;
  busy: boolean;
};

/** Inline confirmation for an action the assistant proposed, worded per
 * tool. Nothing runs until the user approves. */
export function PendingActionCard({
  action,
  onApprove,
  onDeny,
  busy,
}: PendingActionCardProps) {
  const { t, name, known, isPush, ctx, workout, summary, readable, external } =
    usePendingActionView(action);
  return (
    <div className="rounded-2xl border border-edge-strong bg-surface-elevated p-3">
      <p className="text-[13px] font-semibold text-ink-strong">
        {t("pendingAction.confirm", {
          action: known ? t(`action.${name}`) : name,
        })}
      </p>
      <p className="my-2 break-words text-[13px] text-ink-body">
        {isPush ? (
          <PushToGarminSummary
            workout={workout}
            t={t}
            formatDay={ctx.formatDay}
          />
        ) : (
          (summary ?? t("summary.unreadable"))
        )}
      </p>
      {external && (
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Icon icon={Globe} size="xs" color="inherit" aria-hidden="true" />
          {t(`external.${name}`)}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={onApprove} disabled={busy || !readable}>
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
