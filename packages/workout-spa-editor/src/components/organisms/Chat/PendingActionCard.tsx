import type { PendingAction } from "@kaiord/ai";
import { Globe } from "lucide-react";

import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { formatShortDay, type SummaryContext } from "./action-input";
import {
  EXTERNAL_ACTIONS,
  isActionToolName,
  summarizeAction,
} from "./pending-action-summary";
import { PushToGarminSummary } from "./PushToGarminSummary";

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
  const t = useTranslate("chat");
  const tc = useTranslate("connections");
  const locale = useActiveLocale();
  const name = action.toolName;
  const known = isActionToolName(name);
  const ctx: SummaryContext = {
    t,
    dataTypeLabel: (type) => tc(`dataTypes.${type}`),
    formatDay: (day) => formatShortDay(day, locale),
  };
  const isPush = name === "push_to_garmin";
  const summary =
    known && !isPush ? summarizeAction(name, action.input, ctx) : null;
  // Approving what the card cannot describe would be approving blind.
  const readable = isPush || summary !== null;
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
            input={action.input}
            t={t}
            formatDay={ctx.formatDay}
          />
        ) : (
          (summary ?? t("summary.unreadable"))
        )}
      </p>
      {known && EXTERNAL_ACTIONS.has(name) && (
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
